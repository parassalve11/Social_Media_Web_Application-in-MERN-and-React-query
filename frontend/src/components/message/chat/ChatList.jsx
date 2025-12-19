import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { motion as Motion } from "framer-motion";

import { useUser } from "../../../store/user/useUser";
import { useMessageLayout } from "../../../store/message/useMessageLayout";
import formatTimestamp from "../../../lib/formateDate";

/* ---------------- Skeleton Loader ---------------- */
const ChatSkeleton = () => (
  <div className="animate-pulse p-3 flex gap-3">
    <div className="w-12 h-12 bg-gray-300 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  </div>
);

/* ---------------- Empty State ---------------- */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
    <p className="text-sm">No conversations yet</p>
    <p className="text-xs">Start chatting with someone</p>
  </div>
);

/* ---------------- ChatList ---------------- */
function ChatList({ contacts = [], isLoading = false }) {
  const { user } = useUser();
  const { selectedContact, setSelectedContact } = useMessageLayout();
  const [searchTerm, setSearchTerm] = useState("");

  const safeContacts = Array.isArray(contacts) ? contacts : [];

  const filteredContacts = useMemo(() => {
    return safeContacts.filter((c) =>
      c?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [safeContacts, searchTerm]);

  return (
    <div className="w-full max-w-sm  border-r bg-white h-screen flex flex-col">
      {/* ---------- Header ---------- */}
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Plus size={18} />
        </button>
      </div>

      {/* ---------- Search ---------- */}
      <div className="p-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* ---------- Chat List ---------- */}
      <div className="flex-1 overflow-y-auto ">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <ChatSkeleton key={i} />)}

        {!isLoading && filteredContacts.length === 0 && <EmptyState />}

        {!isLoading &&
          filteredContacts.map((contact) => {
            const isActive = selectedContact?._id === contact._id;
            const conversation = contact?.conversation;

            return (
              <Motion.div
                key={contact._id}
                onClick={() => setSelectedContact(contact)}
                whileTap={{ scale: 0.97 }}
                className={`px-4 py-3 flex gap-3 cursor-pointer transition border-b border-gray-300 
                  ${
                    isActive
                      ? "bg-gray-100 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                {/* Avatar */}
                <img
                  src={contact.avatar}
                  alt={contact.username}
                  className="w-12 h-12 rounded-full object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">
                      {contact.username}
                    </h3>

                    {conversation?.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(
                          conversation.lastMessage.createdAt
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500 truncate max-w-[180px]">
                      {conversation?.lastMessage?.content ||
                        "Start a conversation"}
                    </p>

                    {conversation?.unreadCount > 0 &&
                      conversation?.lastMessage?.receiver === user?._id && (
                        <span className="ml-2 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs bg-blue-500 text-white rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                  </div>
                  
                </div>
              
              </Motion.div>
            );
          })}
      </div>
    </div>
  );
}

export default ChatList;
