import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const createNewChat = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({ message: "Other user is not Found" });
      return;
    }

    const exisitingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

    if (exisitingChat) {
      res.json({ message: "chat already exist", chatId: exisitingChat?._id });
      return;
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "New Chat is Createtd",
      chatId: newChat._id,
    });
  } catch (error) {
    console.log("Error in createNewChat controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};



export const getAllChats = async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(400).json({ message: "userId is missing" });
  }

  try {
    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

        const unSeenCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          seen: false,
        });

        let otherUser;
        try {
          otherUser = await User.findById(otherUserId).select("-password");
        } catch (error) {
          console.error("Error fetching user:", error);
          otherUser = { _id: otherUserId, name: "Unknown" };
        }

        return {
          user: otherUser,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unSeenCount,
          },
        };
      })
    );

    res.status(200).json({ chats: chatWithUserData });
  } catch (error) {
    console.error("Error in getAllChats controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id;
    const { chatId, content, image } = req.body;

    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID not found" });
    }
    if (!content && !image) {
      return res.status(400).json({ message: "Required content or image to send" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isUserInChat = chat.users.some(
      (userId) => userId.toString() === senderId.toString()
    );
    if (!isUserInChat) {
      return res.status(403).json({ message: "You are not authorized to access this chat" });
    }

    const otherUserId = chat.users.find(
      (userId) => userId.toString() !== senderId.toString()
    );
    if (!otherUserId) {
      return res.status(400).json({ message: "No other user in the chat" });
    }

    // Socket setup (uncommented and fixed typos for functionality)
    // const receiverSocketId = getReceiverSocketId(otherUserId.toString());
    // let isReceiverInChatRoom = false;

    // if (receiverSocketId) {
    //   const receiverSocket = io.sockets.sockets.get(receiverSocketId);
    //   if (receiverSocket && receiverSocket.rooms.has(chatId)) {
    //     isReceiverInChatRoom = true;
    //   }
    // }

    let messageData = {
      chatId: chat._id,
      sender: senderId,
      seen: isReceiverInChatRoom || false,
      seenAt: isReceiverInChatRoom ? new Date() : undefined,
    };

    let latestMessageText = content;

    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      if (!imgResult) {
        return res.status(400).json({ message: "Image upload failed" });
      }
      messageData.image = {
        url: imgResult.secure_url,
        publicId: imgResult.public_id,
      };
      messageData.messageType = "image";
      messageData.content = content || "";
      latestMessageText = "📷 Image";
    } else {
      messageData.content = content;
      messageData.messageType = "text";
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();

    await Chat.findByIdAndUpdate(
      chatId,
      {
        latestMessage: {
          text: latestMessageText,
          sender: senderId,
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    // Emit sockets
    // io.to(chatId).emit("newMessage", savedMessage);

    // if (receiverSocketId) {
    //   io.to(receiverSocketId).emit("newMessage", savedMessage);
    // }

    // const senderSocketId = getReceiverSocketId(senderId.toString());
    // if (senderSocketId) {
    //   io.to(senderSocketId).emit("newMessage", savedMessage);
    // }

    // if (isReceiverInChatRoom && senderSocketId) {
    //   io.to(senderSocketId).emit("MessagesSeen", {
    //     chatId: chatId,
    //     seenBy: otherUserId,
    //     messagesIds: [savedMessage._id],
    //   });
    // }

    res.status(201).json({ message: savedMessage, sender: senderId });
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getMessageByChat = async(req,res) =>{
  try {
      const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!chatId) {
      res.status(400).json({ message: "ChatId is Missing" });
      return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404).json({ message: "Chats not found" });
      return;
    }

    const isUserInChat = chat.users.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isUserInChat) {
      res.status(403).json({ message: "Do not soil another chats." });
      return;
    }

    const markMessagesToSeen = await Message.find({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });

    await Message.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find(
      (id) => id.toString() !== userId.toString()
    );

    try {
      // const { data } = await axios.get(
      //   `${process.env.USER_SERVICE}/api/v1/users/user/${otherUserId}`
      // );

      if (!otherUserId) {
        res.status(400).json({ message: "Other user is Missing" });
        return;
      }

      const otherUser = await User.findById(otherUserId).select("-password")
      //scoket work
      // if(markMessagesToSeen.length > 0){
      //   const otherUserSocketId = getReceivorSocketId(otherUserId.toString());
      //   if(otherUserSocketId){
      //     io.to(otherUserSocketId).emit("MessagesSeen",{
      //       chatId:chatId,
      //       seenBy:userId,
      //       messagesIds:markMessagesToSeen.map((msg) => msg._id)
      //     })
      //   }
      // }

      res.json({
        messages,
        user: otherUser,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unkown User" },
      });
    }
  } catch (error) {
    console.error("Error in getMessageByChat controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}