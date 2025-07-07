import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { bookmarkPost, createComment, createPost, deletePost,  getBookmarkPosts,  getFollowingPostFeed, getPostById, getPostFeeds, getPostsByHashtag, getTrendingHashtags, likePost } from "../controllers/post.controller.js";


const router = Router();
router.get("/hashtag/:hashtag", getPostsByHashtag);
router.get("/trending-hashtags", getTrendingHashtags);
router.get("/bookmarks",protectRoute,getBookmarkPosts)
router.get("/for-you", protectRoute, getPostFeeds);
router.get("/following", protectRoute, getFollowingPostFeed);
router.post("/create", protectRoute, createPost);
router.delete("/delete/:id", protectRoute, deletePost);
router.get("/:id", protectRoute, getPostById);
router.post("/:id/like", protectRoute, likePost);
router.post("/:id/comment", protectRoute, createComment);
router.post("/:id/bookmark", protectRoute, bookmarkPost);



export default router;
