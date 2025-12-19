import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

import userReducer from "./user/userSlice";
import chatReducer from "./chat/chatSlice";
import messageLayoutReducer from "../store/message/messageLayoutSplice"

// persist configs
const userPersistConfig = {
  key: "user-storage",
  storage,
};

const layoutPersistConfig = {
  key: "layout-storage",
  storage,
};

const persistedUserReducer = persistReducer(
  userPersistConfig,
  userReducer
);

const persistedLayoutReducer = persistReducer(
  layoutPersistConfig,
  messageLayoutReducer
);

export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    chat: chatReducer,                  // ❌ NOT persisted
    messageLayout: persistedLayoutReducer, // ✅ persisted
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
