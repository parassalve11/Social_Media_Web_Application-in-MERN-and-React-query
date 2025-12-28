import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, SmilePlus, Paperclip, Mic, MessageCircle } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import MessageBubble from "./MessageBubble";
import { useChat } from "../../../store/chat/useChat";
import { useUser } from "../../../store/user/useUser";
import {motion as Motion} from 'framer-motion'

/* ---------------- Helpers ---------------- */
const isValidDate = (value) => !isNaN(new Date(value).getTime());

const DateDivider = ({ date }) => {
  if (!isValidDate(date)) return null;
  let label = format(date, "MMMM d");
  if (isToday(date)) label = "Today";
  if (isYesterday(date)) label = "Yesterday";
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-6 flex justify-center"
    >
      <span className="px-4 py-2 text-xs bg-gradient-to-r from-gray-200 to-gray-300 rounded-full text-gray-600 font-medium shadow-sm">
        {label}
      </span>
    </Motion.div>
  );
};

function ChatWindow({ selectedContact, setSelectedContact }) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingId, setRecordingId] = useState(null);
  const messageEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
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

  /* Voice Recording Logic */
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        // Handle audio sending logic here (e.g., append to files)
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingId(Date.now());
    } catch (err) {
      console.error("Recording failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  if (!selectedContact) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 ">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <MessageCircle className="text-3xl" /> {/* Placeholder icon */}
          </div>
          <p className="text-xl font-medium mb-1">No conversation selected</p>
          <p className="text-sm">Select a contact to start chatting</p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!message.trim() && files.length === 0) return;
    const formData = new FormData();
    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);
    if (files.length > 0) {
      files.forEach((file) => {
        formData.append("media", file);
      });
    } else {
      formData.append("content", message.trim());
    }
    await sendMessage(formData);
    setMessage("");
    setFiles([]);
    setPreviews([]);
    stopTyping(selectedContact._id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 ">
     
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/50  px-4 py-4 flex items-center gap-3 shadow-sm">
        <Motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedContact(null)}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200  transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 " />
        </Motion.button>
        <Motion.img
          whileHover={{ scale: 1.05 }}
          src={selectedContact.avatar}
          alt={selectedContact.username}
          className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-md object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{selectedContact.username}</p>
          <div className="flex items-center gap-2">
            <p className={`text-xs font-medium ${
              typing 
                ? 'text-green-600 animate-pulse' 
                : online 
                  ? 'text-green-500' 
                  : 'text-gray-500 '
            }`}>
              {typing ? "Typing..." : online ? "Online" : "Offline"}
            </p>
            {online && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            )}
          </div>
        </div>
      </div>

     
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 ">
        {messages.map((msg, index, arr) => {
          const currentDate = format(new Date(msg.createdAt), "yyyy-MM-dd");
          const prevDate =
            index > 0
              ? format(new Date(arr[index - 1].createdAt), "yyyy-MM-dd")
              : null;
          return (
            <React.Fragment key={msg._id}>
              {currentDate !== prevDate && <DateDivider date={msg.createdAt} />}
              <MessageBubble message={msg} currentUser={user} />
            </React.Fragment>
          );
        })}
        <div ref={messageEndRef} />
      </div>


      <div className="sticky bottom-0 z-10 bg-white/80 backdrop-blur-md border-t border-gray-200/50  px-4 py-4">
        {/* File Previews */}
        {previews.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin">
            {previews.map((src, i) =>
              files[i].type.startsWith("image/") ? (
                <div key={i} className="relative w-16 h-16 flex-shrink-0">
                  <img
                    src={src}
                    className="w-full h-full rounded-xl object-cover shadow-md"
                  />
                  <button 
                    onClick={() => {
                      setFiles(files.filter((_, idx) => idx !== i));
                      setPreviews(previews.filter((_, idx) => idx !== i));
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div key={i} className="relative w-16 h-16 flex-shrink-0">
                  <video
                    src={src}
                    className="w-full h-full rounded-xl object-cover"
                  />
                  <button 
                    onClick={() => {
                      setFiles(files.filter((_, idx) => idx !== i));
                      setPreviews(previews.filter((_, idx) => idx !== i));
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <div className="flex items-end gap-3">
        
          <Motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors duration-200"
          >
            <SmilePlus className="w-5 h-5" />
          </Motion.button>

          {/* File Upload */}
          <label htmlFor="file" className="p-2 text-gray-500 hover:text-blue-500 transition-colors duration-200 cursor-pointer">
            <Paperclip className="w-5 h-5" />
          </label>
          <input
            id="file"
            type="file"
            hidden
            multiple
            accept="image/*,video/*"
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files);
              setFiles(selectedFiles);
              const previewUrls = selectedFiles.map((file) =>
                URL.createObjectURL(file)
              );
              setPreviews(previewUrls);
            }}
          />

          {/* Voice Recording */}
          <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2 rounded-full transition-all duration-200 ${
              isRecording
                ? "bg-red-500 text-white shadow-lg shadow-red-500/25 animate-pulse"
                : "text-gray-500 hover:text-red-500 hover:bg-red-50 "
            }`}
            title={isRecording ? "Release to send" : "Hold to record voice"}
          >
            <Mic className="w-5 h-5" />
            {isRecording && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-red-500 font-mono">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            )}
          </Motion.button>

          {/* Message Input */}
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              startTyping(selectedContact._id);
            }}
            onBlur={() => stopTyping(selectedContact._id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={typing ? " " : "Type a message..."}
            className="flex-1 px-4 py-3 rounded-2xl bg-gray-100/80  outline-none text-gray-900  placeholder-gray-500  transition-colors duration-200 focus:ring-2 focus:ring-blue-500  resize-none max-h-24"
            rows={1}
          />

          {/* Emoji Picker Overlay */}
          {showEmojiPicker && (
            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-0 z-50 w-80"
            >
              <Picker
                data={data}
                onEmojiSelect={(e) => {
                  setMessage((prev) => prev + e.native);
                  setShowEmojiPicker(false);
                }}
                theme="light"
                className="shadow-2xl rounded-2xl overflow-hidden"
              />
            </Motion.div>
          )}

          {/* Send Button */}
          <Motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!message.trim() && files.length === 0}
            className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center ${
              message.trim() || files.length > 0
                ? "bg-blue-500 text-white shadow-lg hover:shadow-xl hover:bg-blue-600"
                : "text-gray-400 bg-gray-100 "
            }`}
          >
            <Send className="w-5 h-5" />
          </Motion.button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;