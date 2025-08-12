import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { redisClient } from "../lib/redis.js";
import { publishToQueue } from "../lib/mail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signUp = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fileds are required" });
    }

    const exisitingUsername = await User.findOne({ username });

    if (exisitingUsername) {
      return res.status(401).json({ message: "Usernname Already exists" });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(401).json({ message: "Email is already exits" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    if (password.length < 6) {
      return res.status(401).json({ message: "at least 6 Char are required" });
    }

    const user = new User({
      name,
      username,
      email,
      password: hashPassword,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("jwt_social", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    await user.save();

    res.status(201).json({ message: "User signUp successffuly" });
  } catch (error) {
    console.log("Error in Signup Controller", error.message);
    res.status(500).json({ message: "Server Error " });
  }
};
export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if ((!username, !password)) {
      return res.status(400).json({ message: "All fileds are required" });
    }

    const exisitingUsername = await User.findOne({ username });

    if (!exisitingUsername) {
      return res.status(401).json({ message: "Username is not exits" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      exisitingUsername.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Password is Invalid" });
    }

    const token = jwt.sign(
      { userId: exisitingUsername._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("jwt_social", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ message: "User Signup successffuly" });
  } catch (error) {
    console.log("Error in SignIn Controller", error.message);
    res.status(500).json({ message: "Server Error " });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { name, email, googleId } = req.body;
    if (!name || !email || !googleId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let user = await User.findOne({ email });
    if (user) {
      if (user.authSource !== "google") {
        return res
          .status(401)
          .json({ message: "User registered with a different auth method" });
      }
      // Update existing Google user
      user.name = name;
      user.googleId = googleId;
    } else {
      // Generate unique username for Google users
      let username = email.split("@")[0];
      let usernameExists = await User.findOne({ username });
      let suffix = 1;
      while (usernameExists) {
        username = `${email.split("@")[0]}${suffix}`;
        usernameExists = await User.findOne({ username });
        suffix++;
      }

      user = new User({
        name,
        email,
        googleId,
        username,
        authSource: "google",
      });
    }

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("jwt_social", token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ message: "Google authentication successful" });
  } catch (error) {
    console.log("Error in GoogleAuth Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("jwt_social");
    res.status(201).json({ message: "User SignOut Succesfully" });
  } catch (error) {
    console.log("Error in SignOut Controller", error.message);
    res.status(500).json({ message: "Server Error " });
  }
};
export const getCurrentUser = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.log("Error in Signup Controller", error.message);
    res.status(500).json({ message: "Server Error " });
  }
};



export const emailExist = async (req, res) => {
  try {

     if (!req.body || !req.body.email) {
      return res.status(400).json({ message: "Email is required for password reset." });
    }
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for password reset." });
    }

    const existingUser = await User.findOne({ email }).select("-password");

    if (!existingUser) {
      return res.status(404).json({ message: "Email not found." });
    }

    const rateLimitKey = `otp:ratelimit:${email}`;
    const isRateLimited = await redisClient.get(rateLimitKey);

    if (isRateLimited) {
      return res.status(429).json({ message: "Please wait 1 minute before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000); 
    const otpKey = `otp:${email}`;

    
    await redisClient.set(otpKey, otp.toString(), { EX: 300 });

  
    await redisClient.set(rateLimitKey, "true", { EX: 60 });

    const message = {
      to: email,
      subject: "Your OTP Code for Password Reset",
      body: otp.toString()
    };

    await publishToQueue("send-otp", message);

    return res.status(200).json({ message: `OTP sent successfully to ${email}` });

  } catch (error) {
    console.error("Error in emailExist Controller:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const verifyUser = async(req,res) =>{
  try {
    const{email , otp:enteredOtp} = req.body;

    if(!email || !enteredOtp){
      res.status(400).json({message:"Email and Otp is requied."})
      return
    };

    const otpKey = `otp:${email}`;

    const storedOtp = await redisClient.get(otpKey);

    if(!storedOtp || storedOtp !== enteredOtp){
      res.status(400).json({message:"Invalid or Expire otp"})
      return
    }

    await redisClient.del(otpKey)

    res.json({message:"User verifed sucessfully for reset password."})
  } catch (error) {
    console.log("Error in verifyUser controller",error.message);
    res.status(500).json({message:"Server Error"})
  }
};



export const resetPassword = async(req,res) =>{
  try {
    const{email,password} = req.body;

    if(!email || !password){
      res.status(400).json({message:"all fileds are required"});
    };

    const user = await User.findOne({email});

    if(!user){
      res.status(404).json({message:"User not Found"})
    }

    if(password.length < 6){
      res.status(401).json({message:"Password should be at least of 6 char"})
    };

    const isSamePassword = await bcrypt.compare(password,user.password);

    if(isSamePassword){
      res.status(403).json({message:"Its Privious password"})
    }
    const hashPassword = await bcrypt.hash(password,10);


    await User.findOneAndUpdate({email},{
      password:hashPassword
    });
  

    res.status(201).json({message:"Password changed successffuly"})
  } catch (error) {
    console.log("Error in resetPassword controller",error.message);
    res.status(500).json({message:"Server Error"})
  }
}