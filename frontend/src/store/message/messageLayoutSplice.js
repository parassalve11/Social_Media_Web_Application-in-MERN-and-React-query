//store/messageLayoutSplice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeTab: "chats",
  selectedContact: null,
};

const messageLayoutSlice = createSlice({
  name: "messageLayout",
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setSelectedContact: (state, action) => {
      state.selectedContact = action.payload;
    },
  },
});

export const { setActiveTab, setSelectedContact } = messageLayoutSlice.actions;

export default messageLayoutSlice.reducer;
