import { io } from "socket.io-client";
import { store } from "../store";

let socket = null;

export const initializeSocket = () => {
  if (socket) return socket;

  const state = store.getState();
  const user = state.user;

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  //connection

  socket.on("connect", () => {
    console.log("Socket is connected on", socket.id);
    socket.emit("conneted_user", user._id);
  });

  //checking errors

  socket.on("connect_error", (error) => {
    console.log("Socket error", error);
  });

  //disconnect

  socket.on("disconnect", (reason) => {
    console.log("Scoket is disconnected", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
