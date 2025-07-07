
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";

export const getPostFeeds = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const pageSize = 7; 

    const query = {};
    let postsQuery = Post.find(query)
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following")
      .limit(pageSize + 1); // Fetch one extra post to check for more

    if (cursor) {
      postsQuery = postsQuery.where('_id').lt(cursor); // Fetch posts before the cursor
    }

    const posts = await postsQuery.exec();

    const hasMore = posts.length > pageSize;
    const nextCursor = hasMore ? posts[pageSize - 1]._id : null;

    res.status(200).json({
      posts: posts.slice(0, pageSize),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.log("Error in getPostFeeds Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const getFollowingPostFeed = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const pageSize = 7; // Number of posts per page
    const following = req.user.following;

    if (!following || following.length === 0) {
      return res.status(200).json({ posts: [], nextCursor: null, hasMore: false });
    }

    let postsQuery = Post.find({
      author: { $in: [...following] },
    })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following")
      .limit(pageSize + 1); // Fetch one extra post to check for more

    if (cursor) {
      if (!mongoose.isValidObjectId(cursor)) {
        return res.status(400).json({ message: "Invalid cursor" });
      }
      postsQuery = postsQuery.where('_id').lt(cursor); // Fetch posts before the cursor
    }

    const posts = await postsQuery.exec();

    const hasMore = posts.length > pageSize;
    const nextCursor = hasMore ? posts[pageSize - 1]._id : null;

    res.status(200).json({
      posts: posts.slice(0, pageSize),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error in getFollowingPostFeed Controller", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    let newPost;
    if (!content) {
      return res.status(400).json({ message: "Content is empty" });
    }

    if (image) {
      const imgResult = await cloudinary.uploader.upload(image);
      if (!imgResult) {
        res.status(401).json({ message: "The image is not get uploaded" });
      }
      newPost = new Post({
        author: req.user._id,
        content: content,
        image: imgResult.secure_url,
      });
    } else {
      newPost = new Post({
        author: req.user._id,
        content: content,
      });
    }

    await newPost.save();

    res.status(200).json({ message: "Post Created successfully." });
  } catch (error) {
    console.log("Error in CreatePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const posts = await Post.findById(postId);

    if (!posts) {
      return res.status(403).json({ message: "Post not Found." });
    }

    if (posts.author.toString() !== userId.toString()) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this Post" });
    }

    if (posts.image) {
      await cloudinary.uploader.destroy(
        posts.image.split("/").pop().split(".")[0]
      );
    }
    await Post.findByIdAndDelete(postId);

    res.status(201).json({ message: "Post deleted successfully." });
  } catch (error) {
    console.log("Error in deletePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const postId = req.params.id;

    const posts = await Post.findById({ postId })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following");

    res.json(posts);
  } catch (error) {
    console.log("Error in getPostById Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const createComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;
    const posts = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { comments: { user: req.user._id, content } },
      },
      { new: true }
    ).populate("author", "name username avatar");

    if (posts.author.toString() !== userId.toString()) {
      const new_Notification = new Notification({
        recipient: posts.author,
        type: "comment",
        relatedUser: userId,
        relatedPost: postId,
      });
      await new_Notification.save();
    }

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in createComment Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const posts = await Post.findById(postId);

    if (posts.likes.includes(userId)) {
      posts.likes = posts.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      posts.likes.push(userId);
    }

    if (posts.author.toString() !== userId.toString()) {
      const newNotification = new Notification({
        recipient: posts.author,
        type: "like",
        relatedUser: userId,
        relatedPost: postId,
      });

      await newNotification.save();
    }

    await posts.save();

    res.status(200).json(posts);
  } catch (error) {
    console.log("Error in likePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const posts = await Post.findById(postId);
    if (posts.bookmarks.includes(userId)) {
      posts.bookmarks = posts.bookmarks.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      posts.bookmarks.push(userId);
    }

    await posts.save();

    res.json(posts);
  } catch (error) {
    console.log("Error in likePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getBookmarkPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await Post.find({ bookmarks: userId })
      .sort({ createdAt: -1 })
      .populate("author", "name username avatar bio followers following")
      .populate("comments.user", "name username avatar bio followers following");

      res.status(200).json(posts);

   
  } catch (error) {
    console.log("Error in likePost Controller", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};




export const getTrendingHashtags = async (req, res) => {
  try {
    // Aggregate to extract and count hashtags
    const hashtagAggregation = await Post.aggregate([
      {
        // Match posts with content (non-empty)
        $match: { content: { $exists: true, $ne: "" } },
      },
      {
        // Project to extract hashtags from content
        $project: {
          hashtags: {
            $regexFindAll: {
              input: "$content",
              regex: "#\\w+",
            },
          },
        },
      },
      {
        // Unwind the hashtags array
        $unwind: "$hashtags",
      },
      {
        // Group by hashtag and count occurrences
        $group: {
          _id: "$hashtags.match",
          count: { $sum: 1 },
        },
      },
      {
        // Sort by count (descending) and limit to top 5
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
      {
        // Project to format output
        $project: {
          hashtag: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(hashtagAggregation);
  } catch (error) {
    console.error("Error in getTrendingHashtags Controller", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};






export const getPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params; // Hashtag from URL (e.g., "coding")
    const cursor = req.query.cursor || null;
    const pageSize = 7; // Match getPostFeeds pageSize

    // Validate hashtag
    if (!hashtag) {
      return res.status(400).json({ message: "Hashtag is required" });
    }

    // Construct regex to match hashtag (case-insensitive)
    const hashtagRegex = new RegExp(`#${hashtag}\\b`, "i");

    // Aggregation pipeline
    let pipeline = [
      {
        $match: {
          content: hashtagRegex,
          ...(cursor && mongoose.isValidObjectId(cursor) ? { _id: { $lt: new mongoose.Types.ObjectId(cursor) } } : {}),
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" }, // Compute number of likes
          commentsCount: { $size: "$comments" }, // Compute number of comments
        },
      },
      {
        $sort: {
          likesCount: -1, // Sort by likes count descending
          commentsCount: -1, // Sort by comments count descending
          createdAt: -1, // Fallback to newest posts
        },
      },
      {
        $limit: pageSize + 1, // Fetch one extra post for pagination
      },
      {
        $lookup: {
          from: "users", // Populate author
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1,
                bio: 1,
                followers: 1,
                following: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$author", // Unwind author array to single object
      },
      {
        $lookup: {
          from: "users", // Populate comments.user
          localField: "comments.user",
          foreignField: "_id",
          as: "commentUsers",
          pipeline: [
            {
              $project: {
                name: 1,
                username: 1,
                avatar: 1,
                bio: 1,
                followers: 1,
                following: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          comments: {
            $map: {
              input: "$comments",
              as: "comment",
              in: {
                $mergeObjects: [
                  "$$comment",
                  {
                    user: {
                      $arrayElemAt: [
                        "$commentUsers",
                        { $indexOfArray: ["$commentUsers._id", "$$comment.user"] },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          commentUsers: 0, // Remove temporary commentUsers field
        },
      },
    ];

    const posts = await Post.aggregate(pipeline);

    const hasMore = posts.length > pageSize;
    const nextCursor = hasMore ? posts[pageSize - 1]._id : null;

    res.status(200).json({
      posts: posts.slice(0, pageSize),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error in getPostsByHashtag Controller", error.stack);
    res.status(500).json({ message: "Server Error" });
  }
};