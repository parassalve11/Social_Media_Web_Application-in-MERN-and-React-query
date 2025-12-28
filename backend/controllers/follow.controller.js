import { type } from "os";
import Follow from "../models/follow.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    //check your following to you
    if (followerId.toString() === userId) {
      return res.status(401).json({ message: "You can not follow yourslef" });
    }

    const follower = await User.findById(followerId);
    const following = await User.findById(userId);

    //user is exists

    if (!follower || !following) {
      return res.status(400).json({ message: "User not Found" });
    }

    const exisitingFollow = await Follow.findOne({
      follower: followerId,
      followed: userId,
    });

    if (exisitingFollow) {
      return res.status(400).json({ message: "already following  this User" });
    }
    const follow = new Follow({
  follower: followerId,
  followed: userId,
});

    await follow.save();

    await User.findByIdAndUpdate(followerId, {
      $addToSet: { following: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: followerId },
    });

    const notification = new Notification({
      recipient: userId,
      type: "follow",
      relatedUser: followerId,
    });

    await notification.save();

    //Real time socket event

    const followedSocketId = req.socketUserMap.get(userId.toString())

    if(followedSocketId){
      req.io.to(followedSocketId).emit("follow_event",{
        followerId,
        followedId:userId,
        type:"follow"
      })
    }

    res.status(200).json({ message: "Succesfully followed User" });
  } catch (error) {
    console.log("Error in followUser Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user._id;

    const followers = await User.findById(followerId);
    const following = await User.findById(userId);

    if (!followers || !following) {
      return res.status(400).json({ message: "User not Found" });
    }

    const exisitingFollow = await Follow.findOne({
      follower: followerId,
      followed: userId,
    });

    if (!exisitingFollow) {
      return res
        .status(401)
        .json({ message: "You are already unfollowed this User" });
    }

    await Follow.deleteOne({ follower: followerId, followed: userId });

    await User.findByIdAndUpdate(followerId, {
      $pull: { following: userId },
    });

    await User.findByIdAndUpdate(userId, {
      $pull: { followers: followerId },
    });

    await Notification.deleteOne({
      recipient: userId,
      type: "follow",
      relatedUser: followerId,
    });

    //Real time socket event

    const followedSocketId = req.socketUserMap.get(userId.toString())

    if(followedSocketId){
      req.io.to(followedSocketId).emit("unfollow_event",{
        followerId,
        followedId:userId,
        type:"unfollow"
      })
    }

    res.status(200).json({ message: "Successffuly unfollowed User" });
  } catch (error) {
    console.log("Error in unfollowUser Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const getfollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate(
      "followers",
      "name username avatar bio"
    );

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    res.json(user.followers);
  } catch (error) {
    console.log("Error in getfollowers Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const getfollowing = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate(
    "following",
    "name username avatar bio"
  );

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.json(user.following);
  try {
  } catch (error) {
    console.log("Error in getfollowing Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};



