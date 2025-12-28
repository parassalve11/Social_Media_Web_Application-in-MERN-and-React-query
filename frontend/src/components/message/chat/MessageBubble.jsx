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
      className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
        setShowMenu(false);
      }}
    >
      <div className="relative max-w-[75%] group">
        {/* Existing Reactions - Enhanced with hover effects */}
        {message.reactions?.length > 0 && (
          <Motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -bottom-6 ${
              isMe ? "right-0" : "left-0"
            } bg-gray-100/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm shadow-lg border border-gray-200 flex items-center gap-1 z-10`}
          >
            {message.reactions.map((r, i) => (
              <span key={`${r.emoji}-${i}`} className="text-xs transition-transform hover:scale-110">
                {r.emoji}
              </span>
            ))}
          </Motion.div>
        )}

        {/* Bubble - Enhanced with subtle gradients and better shadows */}
        <Motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onMouseEnter={() => setShowActions(true)}
          className={`relative px-4 py-3 rounded-3xl shadow-lg backdrop-blur-sm border border-opacity-20
            ${
              isMe
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-blue-500/25"
                : "bg-white/80 text-gray-900 rounded-bl-none shadow-gray-200/50 dark:bg-gray-800/80 dark:text-white dark:border-gray-700/50"
            } max-w-full transition-all duration-200 hover:shadow-xl`}
        >
          {/* Content */}
          {message.contentType === "text" && (
            <p
              className={`${emojiSize} whitespace-pre-wrap break-words leading-relaxed font-light`}
            >
              {message.content}
            </p>
          )}
          {message.contentType === "image" &&
            message.imageOrVideoUrl?.map((url, i) => (
              <div key={i} className="relative my-2 w-48 h-48 md:w-64 md:h-64">
                <img 
                  src={url} 
                  alt="Shared image"
                  className="w-full h-full rounded-2xl object-cover shadow-md cursor-pointer hover:scale-105 transition-transform duration-200" 
                />
                {message.isUploading && (
                  <div className="absolute bottom-0 left-0 w-full bg-gray-900/70 rounded-b-2xl">
                    <div
                      className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-b-2xl transition-all duration-300"
                      style={{
                        width: `${message.uploadProgress?.[i]?.progress || 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          {message.contentType === "video" &&
            message.imageOrVideoUrl?.map((url, i) => (
              <div key={i} className="relative my-2">
                <video
                  src={url}
                  controls
                  className="rounded-2xl max-w-md shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
                {message.isUploading && (
                  <div className="absolute bottom-0 left-0 w-full bg-gray-900/70 rounded-b-2xl">
                    <div
                      className="h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-b-2xl transition-all duration-300"
                      style={{
                        width: `${message.uploadProgress?.[i]?.progress || 0}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

          
          <div className="absolute bottom-2 right-2 text-[10px] opacity-60 font-mono">
            {format(new Date(message.createdAt), "HH:mm")}
          </div>
        </Motion.div>

  
        {showActions && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200/50
              ${isMe ? "-right-16" : "-left-16"} z-20`}
          >
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowReactions((p) => !p);
              }}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-blue-500 transition-colors duration-200"
              title="React"
            >
              💬
            </Motion.button>
            {isMe && (
              <Motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu((p) => !p);
                }}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors duration-200"
                title="More options"
              >
                ⋮
              </Motion.button>
            )}
          </div>
        )}

      
        {showReactions && (
          <Motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 10 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-3 flex gap-3 border border-gray-200/50 z-30"
          >
            {reactions.map((emoji) => (
              <Motion.button
                key={emoji}
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  addReaction(message._id, emoji);
                  setShowReactions(false);
                }}
                className="text-2xl p-1 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                {emoji}
              </Motion.button>
            ))}
          </Motion.div>
        )}

        {/* Delete Menu - Modern dropdown with confirmation */}
        {showMenu && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200/50 text-sm overflow-hidden z-40 w-48"
          >
            <button
              onClick={() => {
                if (window.confirm("Delete this message for everyone?")) {
                  deleteMessage(message._id);
                  deleteMessageSocket(message._id);
                  setShowMenu(false);
                }
              }}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
            >
              <span className="text-red-500">🗑️</span>
              Delete for everyone
            </button>
          </Motion.div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;