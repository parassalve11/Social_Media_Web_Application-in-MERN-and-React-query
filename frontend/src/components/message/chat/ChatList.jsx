// components/Chat/ChatList.jsx
import React, { useMemo, useState } from "react";
import { Plus, X, Pin, Search, Users, MessageCircle } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useMessageLayout } from "../../../store/message/useMessageLayout";
import formatTimestamp from "../../../lib/formateDate";

function ChatList({ contacts = [] }) {
  const { selectedContact, setSelectedContact, pinnedChats, togglePinChat } =
    useMessageLayout();

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /* 🔹 CHAT LIST WITH PIN + SORT */
  const chatList = useMemo(() => {
    const chats = contacts.filter((c) => c.conversation);

    return chats.sort((a, b) => {
      const aPinned = pinnedChats.includes(a._id);
      const bPinned = pinnedChats.includes(b._id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aTime = new Date(a.conversation.lastMessage?.createdAt || 0);
      const bTime = new Date(b.conversation.lastMessage?.createdAt || 0);

      return bTime - aTime;
    });
  }, [contacts, pinnedChats]);

  /* 🔹 SEARCH USERS (NEW CHAT) */
  const searchedUsers = useMemo(() => {
    return contacts.filter(
      (c) =>
        !c.conversation &&
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  return (
    <div className="w-full max-w-md border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 h-screen flex flex-col relative shadow-sm">
      {/* ---------- HEADER ---------- */}
      <div className="p-5 flex justify-between items-center border-b border-gray-200 bg-white backdrop-blur-sm bg-opacity-95 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
            <MessageCircle size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <p className="text-xs text-gray-500">{chatList.length} conversations</p>
          </div>
        </div>
        <Motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSearch(true)}
          className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus size={20} />
        </Motion.button>
      </div>

      {/* ---------- CHAT LIST ---------- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {chatList.length === 0 ? (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full px-8 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Users size={40} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Start a new conversation by clicking the + button above
            </p>
          </Motion.div>
        ) : (
          <Motion.div layout className="py-2">
            {chatList.map((contact) => {
              const isActive = selectedContact?._id === contact._id;
              const lastMessage = contact.conversation?.lastMessage;
              const isPinned = pinnedChats.includes(contact._id);

              return (
                <Motion.div
                  key={contact._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedContact(contact)}
                  className={`mx-2 mb-2 px-4 py-3.5 flex gap-3 cursor-pointer rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg scale-[1.02]"
                      : "hover:bg-white hover:shadow-md"
                  }`}
                >
                  {/* Avatar with online status */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.username}
                      className={`w-14 h-14 rounded-full object-cover ring-2 transition-all ${
                        isActive ? "ring-white" : "ring-gray-200"
                      }`}
                    />
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={`font-semibold truncate text-base ${
                          isActive ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {contact.username}
                      </h3>

                      <div className="flex items-center gap-2">
                        {lastMessage && (
                          <span
                            className={`text-xs ${
                              isActive ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {formatTimestamp(lastMessage.createdAt)}
                          </span>
                        )}

                        <Motion.button
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinChat(contact._id);
                          }}
                          className="transition-colors"
                        >
                          <Pin
                            size={16}
                            className={`transition-all ${
                              isPinned
                                ? isActive
                                  ? "text-yellow-300 fill-yellow-300"
                                  : "text-blue-600 fill-blue-600"
                                : isActive
                                ? "text-blue-200"
                                : "text-gray-300"
                            }`}
                          />
                        </Motion.button>
                      </div>
                    </div>

                    <p
                      className={`text-sm truncate ${
                        isActive ? "text-blue-100" : "text-gray-600"
                      }`}
                    >
                      {lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </Motion.div>
              );
            })}
          </Motion.div>
        )}
      </div>

      {/* ---------- NEW CHAT PANEL ---------- */}
      <AnimatePresence>
        {showSearch && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Search Header */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <Motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm("");
                }}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} />
              </Motion.button>
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search people..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {searchTerm && searchedUsers.length === 0 ? (
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center px-8"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">No users found</p>
                </Motion.div>
              ) : (
                <div className="py-2">
                  {searchedUsers.map((user, index) => (
                    <Motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedContact(user);
                        setShowSearch(false);
                        setSearchTerm("");
                      }}
                      className="mx-2 mb-2 px-4 py-3 flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer rounded-xl transition-all duration-200 hover:shadow-md"
                    >
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                        />
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {user.username}
                        </p>
                        <p className="text-sm text-gray-500">{user.name}</p>
                      </div>
                    </Motion.div>
                  ))}
                </div>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatList;