// src/store/chat/chatSocket.js
import { store } from "../index";
import { getSocket } from "../../services/chat.service";
import {
  addMessage,
  updateMessageStatus,
  deleteMessageLocal,
  updateReactions,
  setTypingUser,
  setUserStatus,
} from "./chatSlice";

export const initializeChatSocket = () => {
  const socket = getSocket();
  if (!socket) return;

  // prevent duplicate listeners
  socket.off("send_message");
  socket.off("message_status_update");
  socket.off("reaction_update");
  socket.off("mesage_delected");
  socket.off("message_error");
  socket.off("user_typing");
  socket.off("user_status");

  socket.on("send_message", (message) => {
    store.dispatch(addMessage(message));
  });

  socket.on("message_status_update", ({ messageId, messageStatus }) => {
    store.dispatch(
      updateMessageStatus({ messageId, messageStatus })
    );
  });

  socket.on("reaction_update", ({ messageId, reactions }) => {
    if (messageId && Array.isArray(reactions)) {
      store.dispatch(updateReactions({ messageId, reactions }));
    }
  });

  socket.on("mesage_delected", ({ deletetMessageId }) => {
    store.dispatch(deleteMessageLocal(deletetMessageId));
  });

  socket.on("user_typing", (payload) => {
    store.dispatch(setTypingUser(payload));
  });

  socket.on("user_status", (payload) => {
    store.dispatch(setUserStatus(payload));
  });

  socket.on("message_error", (err) => {
    console.error("socket message error", err);
  });
};