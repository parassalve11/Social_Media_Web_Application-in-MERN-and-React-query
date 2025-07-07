import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

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
