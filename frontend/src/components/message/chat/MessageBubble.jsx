import React, { useState } from "react";
import { format } from "date-fns";
import { motion as Motion} from "framer-motion";

function MessageBubble({ message, currentUser }) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  if (!message) return null;

  const senderId = message?.sender?._id ?? message?.sender;
  const isMe = String(currentUser?._id) === String(senderId);

  const reactions = ["👍", "❤️", "😂", "🔥", "👏"];

  return (
    <Motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className="relative max-w-[70%] group">

        {/* Bubble */}
        <div
          onMouseEnter={() => setShowActions(true)}
          className={`relative px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
            ${
              isMe
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-white text-gray-800 rounded-bl-md border"
            }
          `}
        >
          {/* Message content */}
          {message.contentType === "text" && (
            <p className="whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.contentType === "image" && (
            <img
              src={message.imageOrVideoUrl}
              alt="media"
              className="rounded-xl max-w-full"
            />
          )}

          {/* Time & Status */}
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px]
              ${isMe ? "text-blue-100" : "text-gray-400"}
            `}
          >
            <span>{format(new Date(message.createdAt), "HH:mm")}</span>

            {isMe && (
              <span>
                {message.messageStatus === "send" && "✓"}
                {message.messageStatus === "delivered" && "✓✓"}
                {message.messageStatus === "read" && "✓✓"}
              </span>
            )}
          </div>
        </div>

        {/* Hover Actions */}
        {showActions && (
          <div
            className={`absolute top-1/2 -translate-y-1/2
              ${isMe ? "-left-10" : "-right-10"}
              flex flex-col gap-1`}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="w-8 h-8 rounded-full bg-white shadow hover:bg-gray-100 text-sm"
            >
              🙂
            </button>
          </div>
        )}

        {/* Reactions */}
        {showReactions && (
          <div
            className={`absolute -top-9 ${
              isMe ? "right-0" : "left-0"
            } bg-black/80 rounded-full px-2 py-1 flex gap-1`}
          >
            {reactions.map((emoji) => (
              <button
                key={emoji}
                className="hover:scale-125 transition"
                onClick={() => setShowReactions(false)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Existing Reactions */}
        {message.reactions?.length > 0 && (
          <div
            className={`absolute -bottom-5 ${
              isMe ? "right-2" : "left-2"
            } bg-gray-200 rounded-full px-2 py-0.5 text-xs shadow`}
          >
            {message.reactions.map((r, i) => (
              <span key={i}>{r.emoji}</span>
            ))}
          </div>
        )}
      </div>
    </Motion.div>
  );
}

export default MessageBubble;
