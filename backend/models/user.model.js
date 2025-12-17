import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
       required: false, // Optional for Google users
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
    },
    authSource: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2017/07/18/23/23/user-2517430_1280.png" // Default avatar URL
    },
    lastSeen:{
      type:Date
    },
    isOnline:{
      type:Boolean , 
      default:false
    },
    bannerImage: {
      type: String,
      default: "https://cdn.pixabay.com/photo/2020/05/21/11/08/banner-5200272_1280.jpg" // Default banner URL
    },
    bio: {
      type: String,
      default: "",
      maxlength: 160 // Common bio length limit (e.g., Twitter/X)
    },
    location: {
      type: String,
      default: "",
      maxlength: 50
    },
    website: {
      type: String,
      default: "",
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false // For verified badges like on Instagram/Twitter
    },
    postsCount: {
      type: Number,
      default: 0 // Track number of posts
    },
   
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;