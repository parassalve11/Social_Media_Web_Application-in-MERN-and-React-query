import React, { useState } from "react";
import { format } from "date-fns";
import { motion as Motion } from "framer-motion";
import { useChat } from "../../../store/chat/useChat";

/* ---------- Emoji size logic ---------- */
const getEmojiStyle = (text) => {
  const emojis = text.match(/(\p{Extended_Pictographic})/gu);

  if (!emojis || emojis.join("") !== text) return "text-sm";
  if (emojis.length === 1) return "text-5xl";
  if (emojis.length <= 3) return "text-3xl";
  return "text-sm";
};

function MessageBubble({ message, currentUser }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { addReaction, deleteMessage, deleteMessageSocket } = useChat();

  const senderId = message?.sender?._id ?? message?.sender;
  const isMe = String(currentUser?._id) === String(senderId);

  const emojiSize =
    message.contentType === "text" ? getEmojiStyle(message.content) : "text-sm";

  const reactions = ["👍", "❤️", "😂", "🔥", "👏"];

  return (
    <div
      className={`flex  mb-1 ${isMe ? "justify-end" : "justify-start"}`}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
        setShowMenu(false);
      }}
    >
      <div className="relative max-w-[70%]">
        {/* Bubble */}
        <div
          onMouseEnter={() => setShowActions(true)}
          className={`px-4 py-2 rounded-2xl shadow-sm
            ${
              isMe
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-white text-gray-800 rounded-bl-md border"
            }`}
        >
          {message.contentType === "text" && (
            <p
              className={`${emojiSize} whitespace-pre-wrap break-words break-all`}
            >
              {message.content}
            </p>
          )}

          {message.contentType === "image" && (
            <img
              src={message.imageOrVideoUrl}
              className="rounded-xl max-w-[240px]"
            />
          )}

          {/* Time */}
          <div className="text-[10px] mt-1 text-right opacity-70">
            {format(new Date(message.createdAt), "HH:mm")}
          </div>
        </div>

        {/* Hover Actions */}
        {showActions && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex gap-1
              ${isMe ? "-left-14" : "-right-14"}`}
          >
            <button
              onClick={() => setShowReactions((p) => !p)}
              className="w-8 h-8 bg-white shadow rounded-full"
            >
              🙂
            </button>

            {isMe && (
              <button
                onClick={() => setShowMenu((p) => !p)}
                className="w-8 h-8 bg-white shadow rounded-full"
              >
                ⋮
              </button>
            )}
          </div>
        )}

        {/* Reaction Picker */}
        {showReactions && (
          <Motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white shadow rounded-full px-3 py-1 flex gap-2"
          >
            {reactions.map((emoji) => (
              <Motion.button
                key={emoji}
                whileHover={{ scale: 1.4 }}
                onClick={() => {
                  addReaction(message._id, emoji);
                  setShowReactions(false);
                }}
                className="text-lg"
              >
                {emoji}
              </Motion.button>
            ))}
          </Motion.div>
        )}

        {/* Delete Menu */}
        {showMenu && (
          <div className="absolute right-0 top-10 bg-white shadow rounded text-xs z-50">
            <button
              onClick={() => {
                deleteMessage(message._id);
                deleteMessageSocket(message._id);
              }}
              className="px-4 py-2 hover:bg-gray-100 w-full text-left"
            >
              Delete for everyone
            </button>
          </div>
        )}

        {/* Existing Reactions */}
        {message.reactions?.length > 0 && (
          <div
            className={`absolute -bottom-5 ${
              isMe ? "right-2" : "left-2"
            } bg-gray-200 rounded-full px-2 py-0.5 text-xs shadow`}
          >
            {message.reactions.map((r) => r.emoji).join("")}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
