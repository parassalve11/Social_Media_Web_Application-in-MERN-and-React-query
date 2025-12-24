import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, SmilePlus, Paperclip } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

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

function ChatWindow({ selectedContact, setSelectedContact }) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
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
    clearMessages,
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

    if (conversationId) fetchMessages(conversationId);
    else clearMessages();
  }, [conversationId, selectedContact?._id]);

  /* Auto-scroll */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <p className="text-lg">Start a conversation</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim() && !file) return;

    const formData = new FormData();
    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);

    if(user._id && selectedContact){
      if (file) {
      formData.append("media", file);
    } else {
      formData.append("content", message.trim());
    }
    }else{
      throw new Error("User Id is not found")
    }

    await sendMessage(formData);

    setMessage("");
    setFile(null);
    stopTyping(selectedContact._id);
  };

  return (
    <div className="flex flex-col h-full overflow-x-hidden  bg-gray-50">

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
      <div className="flex-1 overflow-y-auto  px-4 py-3">
        {messages.map((msg, index, arr) => {
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

              <MessageBubble
                message={msg}
                currentUser={user}
              />
            </React.Fragment>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* ---------- INPUT ---------- */}
      <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2 items-center">

        <button onClick={() => setShowEmojiPicker((p) => !p)}>
          <SmilePlus className="w-5 h-5 text-gray-500" />
        </button>

        <label htmlFor="file">
          <Paperclip className="w-5 h-5 text-gray-500 cursor-pointer" />
        </label>
        <input
          id="file"
          type="file"
          hidden
          onChange={(e) => setFile(e.target.files[0])}
        />

        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50">
            <Picker
              data={data}
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
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 outline-none"
        />

        <button
          onClick={handleSend}
          disabled={!message.trim() && !file}
          className="text-blue-600"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
