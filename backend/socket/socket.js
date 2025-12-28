import { Server } from "socket.io";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

//Map to find user is online or not - > userId , socketId

let onlineUsers = new Map();

//Map to track typing status of users in conversation --> userId,[conversation]

let typingStatus = new Map();

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000, // Disconnect user automatically offline in under 60 sec
  });

  io.on("connection", (socket) => {
    console.log("User is connected to SocketId", socket.id);

    let userId = null;

    //handle user connection and show mark thrm online in db

    try {
      socket.on("user_connected", async (connectionUserId) => {
        if (!connectionUserId) {
          console.warn("❌ user_connected called without userId");
          return;
        }

        userId = connectionUserId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: true,
          lastSeen: null,
        });
      });
    } catch (error) {
      console.error(
        "Error while establishing user connection in socket",
        error.message
      );
    }

    //Return online Status of requested User

    socket.on("get_user_status", (requestUserId, callback) => {
      let isOnline = onlineUsers.has(requestUserId);
      callback({
        userId: requestUserId,
        isOnline: isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    //send mesage to reciver according if  isonline

    socket.on("send_message", async (message) => {
      try {
        const senderSocketId = onlineUsers.get(message?.sender?._id);
        const receiverSocketId = onlineUsers.get(message?.receiver?._id);

        if (senderSocketId) {
          io.to(senderSocketId).emit("send_message", message);
        }

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("recevie_message", message);
        }
      } catch (error) {
        console.error(
          "Error while sending message to reciver in socket",
          error.message
        );
        socket.emit("message_error", { error: "Faild to send message" });
      }
    });

    //update messages as read and notify sender

    socket.on("message_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          {
            _id: { $in: messageIds },
          },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit("message_status_update", {
              messageId,
              messageStatus: "read",
            });
          });
        }
      } catch (error) {
        console.error(
          "Error while updating messageStatus mark as read in socket",
          error.message
        );
      }
    });

    //handle typing status auto on and off on after 2sec

    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingStatus.has(userId)) typingStatus.set(userId, {});

      const userTyping = typingStatus.get(userId);

      userTyping[conversationId] = true;

      //clear existing time-out
      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(userTyping[`${conversationId}_timeout`]);
      }

      //auto-stop after 3s
      userTyping[`${conversationId}_timeout`] = setTimeout(() => {
        userTyping[conversationId] = false;
        socket.to(receiverId).emit("user_typing", {
          userId,
          conversationId,
          isTyping: false,
        });
      }, 2000);

      //notify sender is typing to reciver

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingStatus.has(userId)) {
        const userTyping = typingStatus.get(userId);
        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(userTyping[`${conversationId}_timeout`]);
          delete userTyping[`${conversationId}_timeout`];
        }
      }
      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    //delete action 
    socket.on("delete_message", async ({ messageId, conversationId }) => {
  try {
    await Message.findByIdAndDelete(messageId);

    const users = io.socketUserMap;

    users.forEach((socketId) => {
      io.to(socketId).emit("mesage_delected", {
        deletetMessageId: messageId,
        conversationId,
      });
    });
  } catch (err) {
    console.error("Delete message socket error", err.message);
  }
});

    //add reaction on time to both user in conversation
    // add reaction to both users
    socket.on(
      "add_reaction",
      async ({ messageId, emoji, userId: reactionUserId }) => {
        try {
          const message = await Message.findById(messageId);
          if (!message) return;

          const existingIndex = message.reactions.findIndex(
            (r) => r.user.toString() === reactionUserId
          );

          if (existingIndex > -1) {
            const existing = message.reactions[existingIndex];

            if (existing.emoji === emoji) {
              // remove reaction if same clicked twice
              message.reactions.splice(existingIndex, 1);
            } else {
              // change emoji
              message.reactions[existingIndex].emoji = emoji;
            }
          } else {
            // add new reaction
            message.reactions.push({ user: reactionUserId, emoji });
          }

          await message.save();

          const populatedMessage = await Message.findById(message._id)
            .populate("sender", "username profilePhoto")
            .populate("receiver", "username profilePhoto")
            .populate("reactions.user", "username profilePhoto");

          const senderSocket = onlineUsers.get(
            populatedMessage.sender._id.toString()
          );
          const receiverSocket = onlineUsers.get(
            populatedMessage.receiver._id.toString()
          );

          const payload = {
            messageId: populatedMessage._id,
            reactions: populatedMessage.reactions,
          };

          if (senderSocket)
            io.to(senderSocket).emit("reaction_update", payload);
          if (receiverSocket)
            io.to(receiverSocket).emit("reaction_update", payload);
        } catch (error) {
          console.error("Error handling Reactions in Socket", error.message);
        }
      }
    );


    //follow user in real-time
    socket.on("follow_user",async({followerId,followedId}) =>{
      try {
        if(!followedId || !followerId) return;

        const followedSocketId = onlineUsers.get(followedId);

        if(followedSocketId){
          io.to(followedSocketId).emit("follow_event",{
            followedId,
            followerId,
            type:"follow"
          })
        }
      } catch (error) {
        console.error("Scoket follow error",error.message);
        
      }
    })
    //unfollow user in real-time
    socket.on("unfollow_user",async({followerId,followedId}) =>{
      try {
        if(!followedId || !followerId) return;

        const followedSocketId = onlineUsers.get(followedId);

        if(followedSocketId){
          io.to(followedSocketId).emit("unfollow_event",{
            followedId,
            followerId,
            type:"unfollow"
          })
        }
      } catch (error) {
        console.error("Scoket unfollow error",error.message);
        
      }
    })

    const handleDisconnect = async () => {
      try {
        if (!userId) return;

        onlineUsers.delete(userId);

        if (typingStatus.get(userId)) {
          const userTyping = typingStatus.get(userId);
          //clear all timeouts
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout")) clearTimeout(userTyping[key]);
          });
          typingStatus.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId), console.log(`user ${userId} disconnected`);
      } catch (error) {
        console.error("Error handling disconnection", error.message);
      }
    };

    //disconnect event

    socket.on("disconnect", handleDisconnect);



  });

  io.socketUserMap = onlineUsers;

  return io;
};
