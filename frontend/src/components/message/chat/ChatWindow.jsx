import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, SmilePlus } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { motion as Motion } from "framer-motion";

import MessageBubble from "./MessageBubble";
import { useChat } from "../../../store/chat/useChat";
import { useUser } from "../../../store/user/useUser";

/* ---------------- Helpers ---------------- */
const isValidDate = (value) => !isNaN(new Date(value).getTime());

const DateDivider = ({ date }) => {
  if (!isValidDate(date)) return null;

  let label = format(date, "MMMM d");
  if (isToday(date)) label = "Today";
  if (isYesterday(date)) label = "Yesterday";

  return (
    <div className="my-4 flex justify-center">
      <span className="px-3 py-1 text-xs bg-gray-200 rounded-full text-gray-600">
        {label}
      </span>
    </div>
  );
};

const MessageSkeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    <div className="w-1/3 h-4 bg-gray-300 rounded" />
    <div className="w-1/2 h-4 bg-gray-200 rounded" />
    <div className="w-1/4 h-4 bg-gray-300 rounded ml-auto" />
  </div>
);

/* ---------------- ChatWindow ---------------- */
function ChatWindow({ selectedContact,setSelectedContact }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messageEndRef = useRef(null);

  const { user } = useUser();
  const {
    messages,
    fetchMessages,
    sendMessage,
    isTypingUser,
    isUserOnline,
    startTyping,
    stopTyping,
    isLoadingMessages,
    clearMessages
  } = useChat();

  const conversationId = selectedContact?.conversation?._id;
  const online = isUserOnline(selectedContact?._id);
  const typing = isTypingUser(selectedContact?._id);

  /* Fetch messages */
 useEffect(() => {
  if (!selectedContact) {
    clearMessages();
    return;
  }

  if (conversationId) {
    fetchMessages(conversationId);
  } else {
    // No conversation yet → clean slate
    clearMessages();
  }
}, [conversationId, selectedContact?._id]);

 
  

  /* Auto-scroll */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedContact]);

  if (!selectedContact ) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
      <span className="text-lg font-medium">Start a conversation</span>
      <span className="text-sm">
        Send your first message to begin chatting
      </span>
    </div>
  );
}

  const handleSend = async () => {
    if (!message.trim()) return;

    const formData = new FormData();
    formData.append("senderId", user?._id);
    formData.append("receiverId", selectedContact._id);
    formData.append("content", message.trim());
    formData.append("messageStatus", "send");

    await sendMessage(formData);
    setMessage("");
    stopTyping(selectedContact._id);
  };

  return (
    <div className="flex flex-col h-full w-full  bg-gray-50">

      {/* ---------- HEADER ---------- */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => setSelectedContact(null)}>
          <ArrowLeft className="w-5 h-5" />
        </button>

        <img
          src={selectedContact.avatar}
          alt={selectedContact.username}
          className="w-10 h-10 rounded-full"
        />

        <div className="flex-1">
          <p className="font-semibold">{selectedContact.username}</p>
          <p className="text-xs text-gray-500">
            {typing ? "Typing..." : online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* ---------- MESSAGES ---------- */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoadingMessages && <MessageSkeleton />}

        {!isLoadingMessages && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Say hello 👋</p>
          </div>
        )}

        {!isLoadingMessages &&
          messages.map((msg, index, arr) => {
            const currentDate = format(new Date(msg.createdAt), "yyyy-MM-dd");
            const prevDate =
              index > 0
                ? format(new Date(arr[index - 1].createdAt), "yyyy-MM-dd")
                : null;

            return (
              <React.Fragment key={msg._id}>
                {currentDate !== prevDate && (
                  <DateDivider date={msg.createdAt} />
                )}

                <Motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <MessageBubble
                    message={msg}
                    currentUser={user}
                  />
                </Motion.div>
              </React.Fragment>
            );
          })}

        <div ref={messageEndRef} />
      </div>

      {/* ---------- INPUT ---------- */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2 items-center">
        <button
          onClick={() => setShowEmojiPicker((p) => !p)}
          className="text-gray-500 hover:text-gray-700"
        >
          <SmilePlus className="w-5 h-5" />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50">
            <Picker
              data={data}
              theme="light"
              onEmojiSelect={(e) => {
                setMessage((prev) => prev + e.native);
                setShowEmojiPicker(false);
              }}
            />
          </div>
        )}

        <input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            startTyping(selectedContact._id);
          }}
          onBlur={() => stopTyping(selectedContact._id)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Write a message..."
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="text-blue-600 disabled:text-gray-300"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
