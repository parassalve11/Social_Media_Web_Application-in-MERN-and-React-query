
import mongoose from "mongoose";

const chatSchema  = new mongoose.Schema({
    users:[{
        type:String,
        required:true
    }],
    latestMessage:{
        text:String,
        sender:String
    },

},{timestamps:true});



const Chat = mongoose.model("Chat",chatSchema);

export default Chat;