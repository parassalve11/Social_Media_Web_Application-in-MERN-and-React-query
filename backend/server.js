
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

dotenv.config();

const app = express();

app.use(cookieParser());

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const PORT = process.env.PORT || 5000;

app.use(express.json({limit:"5mb"}));


app.use('/api/v1/auth',authRouters);
app.use('/api/v1/posts',postRoutes);
app.use('/api/v1/notifications',notificationRoutes);
app.use('/api/v1/follows',followRoutes);
app.use('/api/v1/users',userRoutes);


app.listen(PORT,() =>{
    console.log("Server is Running on ", PORT);
    connectDB();
})