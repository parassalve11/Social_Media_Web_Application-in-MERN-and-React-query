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
  updateMediaProgress,
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
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus") || "send";

    const mediaFiles = formData.getAll("media");
    const hasMedia = mediaFiles.length > 0;
    const tempId = `temp-${Date.now()}`;

    // Optimistic preview
    const previewUrls = hasMedia
      ? mediaFiles.map((file) => URL.createObjectURL(file))
      : [];

    const contentType = hasMedia
      ? mediaFiles[0].type.startsWith("video/")
        ? "video"
        : "image"
      : "text";

    dispatch(
      addMessage({
        _id: tempId,
        sender: senderId,
        receiver: receiverId,
        conversation: currentConversation,
        imageOrVideoUrl: previewUrls,
        content,
        contentType,
        createdAt: new Date().toISOString(),
        messageStatus,
        isOptimistic: true,
        isUploading: hasMedia,
        uploadProgress: hasMedia
          ? mediaFiles.map((_, i) => ({ index: i, progress: 0 }))
          : [],
      })
    );

    try {
      const uploadedUrls = [];

      // Upload files one by one for real progress
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const singleForm = new FormData();
        singleForm.append("senderId", senderId);
        singleForm.append("receiverId", receiverId);
        singleForm.append("media", file);

        const { data } = await axiosInstance.post(
          "/message/send-message",
          singleForm,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (event) => {
              if (!event.total) return;
              const percent = Math.round((event.loaded * 100) / event.total);
              dispatch(
                updateMediaProgress({ messageId: tempId, index: i, progress: percent })
              );
            },
          }
        );

        uploadedUrls.push(data.data?.imageOrVideoUrl?.[0] || "");
      }

      // After all files uploaded, create final message
      const finalMessage = {
        _id: tempId,
        sender: senderId,
        receiver: receiverId,
        conversation: currentConversation,
        imageOrVideoUrl: uploadedUrls,
        content,
        contentType,
        createdAt: new Date().toISOString(),
        messageStatus: "send",
        isUploading: false,
      };

      dispatch(
        replaceMessage({
          tempId,
          message: finalMessage,
        })
      );

      // cleanup preview URLs
      previewUrls.forEach((url) => URL.revokeObjectURL(url));

      return finalMessage;
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