import React, { useMemo, useState } from "react";
import { Plus, X, Pin } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useMessageLayout } from "../../../store/message/useMessageLayout";
import formatTimestamp from "../../../lib/formateDate";

function ChatList({ contacts = [] }) {
  const {
    selectedContact,
    setSelectedContact,
    pinnedChats,
    togglePinChat,
  } = useMessageLayout();

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /* 🔹 CHAT LIST WITH PIN + SORT */
  const chatList = useMemo(() => {
    const chats = contacts.filter((c) => c.conversation);

    return chats.sort((a, b) => {
      const aPinned = pinnedChats.includes(a._id);
      const bPinned = pinnedChats.includes(b._id);

      // 1️⃣ pinned chats always on top
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // 2️⃣ latest message first
      const aTime = new Date(
        a.conversation.lastMessage?.createdAt || 0
      );
      const bTime = new Date(
        b.conversation.lastMessage?.createdAt || 0
      );

      return bTime - aTime;
    });
  }, [contacts, pinnedChats]);

  /* 🔹 SEARCH USERS (NEW CHAT) */
  const searchedUsers = useMemo(() => {
    return contacts.filter(
      (c) =>
        !c.conversation &&
        c.username
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  return (
    <div className="w-full max-w-md border-r bg-white h-screen flex flex-col relative">

      {/* ---------- HEADER ---------- */}
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
        <button
          onClick={() => setShowSearch(true)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ---------- CHAT LIST ---------- */}
      <div className="flex-1 overflow-y-auto">
        {chatList.length === 0 && (
          <div className="text-center mt-10 text-gray-400 text-sm">
            No conversations yet
          </div>
        )}

        <Motion.div layout>
          {chatList.map((contact) => {
            const isActive =
              selectedContact?._id === contact._id;
            const lastMessage =
              contact.conversation?.lastMessage;
            const isPinned = pinnedChats.includes(
              contact._id
            );

            return (
              <Motion.div
                key={contact._id}
                layout
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedContact(contact)}
                className={`px-4 py-3 flex gap-3 cursor-pointer border-b
                  ${
                    isActive
                      ? "bg-gray-100 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
              >
                <img
                  src={contact.avatar}
                  alt={contact.username}
                  className="w-12 h-12 rounded-full"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">
                      {contact.username}
                    </h3>

                    <div className="flex items-center gap-2">
                      {lastMessage && (
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(
                            lastMessage.createdAt
                          )}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinChat(contact._id);
                        }}
                      >
                        <Pin
                          size={14}
                          className={`${
                            isPinned
                              ? "text-blue-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 truncate">
                    {lastMessage?.content}
                  </p>
                </div>
              </Motion.div>
            );
          })}
        </Motion.div>
      </div>

      {/* ---------- NEW CHAT PANEL ---------- */}
      <AnimatePresence>
        {showSearch && (
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-white z-50 flex flex-col"
          >
            <div className="p-4 flex items-center gap-3 border-b">
              <button onClick={() => setShowSearch(false)}>
                <X />
              </button>
              <input
                autoFocus
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search people"
                className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchedUsers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => {
                    setSelectedContact(user);
                    setShowSearch(false);
                    setSearchTerm("");
                  }}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-100 cursor-pointer"
                >
                  <img
                    src={user.avatar}
                    className="w-10 h-10 rounded-full"
                  />
                  <p className="font-medium">
                    {user.username}
                  </p>
                </div>
              ))}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatList;
