import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const getSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const followers = req.user.followers;
    const following = req.user.following;
    const user = await User.find({
      _id: {
        $ne: userId,
        $nin: [...followers, ...following],
      },
    }).limit(3);

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    res.json(user);
  } catch (error) {
    console.log("Error in getSuggestions controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const getProfile = async (req, res) => {
  try {


    const user = await User.findOne({ username: req.params.username }).select("-password");

    if (!user) {
      return res.status(400).json({ message: "User not Found" });
    }

    res.json(user);
  } catch (error) {
    console.log("Error in getProfile controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
    "name",
      "username",
      "avatar",
      "bannerImage",
      "bio",
      "location",
      "website",
    ];

    const updatedData = {};

    for (const field of allowedFields) {
      if (req.body[field]) {
        updatedData[field] = req.body[field];
      }
    }

    if (req.body.avatar) {
      const result = await cloudinary.uploader.upload(req.body.avatar);
      updatedData.avatar = result.secure_url;
    }
    if (req.body.bannerImg) {
      const result = await cloudinary.uploader.upload(req.body.bannarImg);
      updatedData.bannarImg = result.secure_url;
    }

  const user =   await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatedData },
      { new: true }
    ).select("-password");

    res.status(200).json(user)
  } catch (error) {
    console.log("Error in updateProfile controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log("Error in getUserByUsername controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query; // Query parameter for search (e.g., /search?q=john)
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } }, // Case-insensitive partial match
        { name: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: req.user._id }, // Exclude the authenticated user
    })
      .select("-password")
      .limit(10); // Limit to 10 results for performance

    res.json(users);
  } catch (error) {
    console.log("Error in searchUsers controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};