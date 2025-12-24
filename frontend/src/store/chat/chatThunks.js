// src/store/chat/chatThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from '../../lib/axiosIntance'
import {
  setConversations,
  setMessages,
  setCurrentConversation,
  addMessage,
  replaceMessage,
  updateMessageStatus,
} from "./chatSlice";
import { getSocket } from "../../services/chat.service";

export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (_, { dispatch }) => {
    const { data } = await axiosInstance.get("/message/conversations");
    dispatch(setConversations(data));
    return data;
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId, { dispatch }) => {
    const { data } = await axiosInstance.get(
      `/message/conversation/${conversationId}/messages`
    );

    const messages = data?.data || data || [];
    dispatch(setMessages(messages));
    dispatch(setCurrentConversation(conversationId));
    return messages;
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (formData, { dispatch, getState }) => {
    const { currentConversation } = getState().chat;

    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus") || "send";

    const tempId = `temp-${Date.now()}`;

    dispatch(
      addMessage({
        _id: tempId,
        sender: senderId,
        receiver: receiverId,
        conversation: currentConversation,
        imageOrVideoUrl: media ? URL.createObjectURL(media) : null,
        content,
        contentType: media ? "image" : "text",
        createdAt: new Date().toISOString(),
        messageStatus,
      })
    );

    try {
      const { data } = await axiosInstance.post(
        "/message/send-message",
        formData
      );

      const realMessage = data?.data || data;

      dispatch(setCurrentConversation(realMessage.conversation));
      dispatch(replaceMessage({ tempId, message: realMessage }));

      return realMessage;
    } catch (error) {
      dispatch(
        updateMessageStatus({
          messageId: tempId,
          messageStatus: "failed",
        })
      );
      throw error;
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "chat/deleteMessage",
  async (messageId) => {
    await axiosInstance.delete(`/message/messages/${messageId}`);
    return messageId;
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "chat/markRead",
  async (_, { getState }) => {
    const { messages, currentUser } = getState().chat;

    const unread = messages.filter(
      (m) =>
        m.messageStatus !== "read" &&
        m?.receiver?._id === currentUser?._id
    );

    if (!unread.length) return;

    await axiosInstance.put("/message/messages/read", {
      messageIds: unread.map((m) => m._id),
    });

    const socket = getSocket();
    socket?.emit("message_read", {
      messageIds: unread.map((m) => m._id),
      senderId: messages[0]?.sender?._id,
    });
  }
);