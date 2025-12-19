import React from "react";


import { motion as Motion } from "framer-motion";

import MessagesLayout from "../components/message/MessageLayout";
import ChatList from "../components/message/chat/ChatList";
import axiosInstance from '../lib/axiosIntance'
import { useQuery } from "@tanstack/react-query";


function MessagePage() {




  const {data:contacts = []}  = useQuery({
    queryKey:['AllUsers'],
    queryFn:async() => {
      const res = await axiosInstance.get('/users/all')
      
      return res?.data?.data
    }
  })





  
  
  


  return (
    <MessagesLayout>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className=""
      >
      
         <ChatList contacts={contacts}  />
     
      </Motion.div>
    </MessagesLayout>
  );
}

export default MessagePage;
