import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createNewChat, getAllChats, getMessageByChat, sendMessage } from "../controllers/chat.controller.js";




const router = Router();


router.post('/new',protectRoute,createNewChat);
router.get('/chat/all',protectRoute,getAllChats);
router.post('/message',protectRoute,sendMessage);
router.get('/message/:chatId',protectRoute,getMessageByChat)



export default router;