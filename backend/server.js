
import express from "express";
import dotenv from 'dotenv'
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import authRouters from "./routers/auth.route.js";
import cors from 'cors'
import postRoutes from "./routers/post.route.js";
import notificationRoutes from "./routers/notification.route.js";
import followRoutes from "./routers/follow.route.js";
import userRoutes from "./routers/user.route.js";
import { sendOtpToConsumers } from "./lib/mail.js";
import path from 'path'
import chatRoutes from "./routers/chat.route.js";

dotenv.config();

const app = express();

app.use(cookieParser());

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.json({limit:"5mb"}));


app.use('/api/v1/auth',authRouters);
app.use('/api/v1/posts',postRoutes);
app.use('/api/v1/notifications',notificationRoutes);
app.use('/api/v1/follows',followRoutes);
app.use('/api/v1/users',userRoutes);
app.use('/api/v1/chats',chatRoutes)

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"/frontend/dist")));

   app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
   });
}

app.listen(PORT,() =>{
    console.log("Server is Running on ", PORT);
    sendOtpToConsumers();
    connectDB();
})