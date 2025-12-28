//Socket

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { initializeSocket, disconnectSocket } from "../services/chat.service";
import { initializeChatSocket } from "../store/chat/chatSocket";
import { useChat } from "../store/chat/useChat";  // Zustand-like hook

const SocketInitializer = () => {
  const user = useSelector((state) => state.user.user);
  const { setCurrentUser, cleanUp } = useChat();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      if (socket) {
        setCurrentUser(user);
        initializeChatSocket();
      }
    }

    return () => {
      cleanUp();
      disconnectSocket();
    };
  }, [user]);

  return null;
};

export default SocketInitializer;
