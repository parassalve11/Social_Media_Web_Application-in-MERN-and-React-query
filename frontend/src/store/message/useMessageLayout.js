//store/message/useMessageLayout.js
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab, setSelectedContact } from  './messageLayoutSplice'

export const useMessageLayout = () => {
  const dispatch = useDispatch();

  // ✅ FIXED SELECTOR
  const messageLayoutState = useSelector((state) => state.messageLayout);

  return {
    activeTab: messageLayoutState.activeTab,
    selectedContact: messageLayoutState.selectedContact,

    // Zustand-like setters
    setActiveTab: (tab) => dispatch(setActiveTab(tab)),
    setSelectedContact: (contact) => dispatch(setSelectedContact(contact)),
  };
};
