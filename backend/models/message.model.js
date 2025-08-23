
import mongoose, { Schema } from 'mongoose'

const messageSchema  = new mongoose.Schema({
    chatId:{
        type:Schema.Types.ObjectId,
        ref:"Chat", 
        required:true
    },
    sender:{
        type:String,
        required:true
    },
    content:String,
    image:{
        url:String,
        publicId:String
    },
    messageType:{
        type:String,
        enum:["text" , "image"],
        default:"text"
    },
    seen:{
        type:Boolean,
        default:false
    },
    seenAt:{
        type:Date,
        default:null
    }
},{timestamps:true})



const Message = mongoose.model("Message",messageSchema);


export default Message;