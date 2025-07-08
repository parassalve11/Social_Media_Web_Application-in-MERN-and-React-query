import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "../UI/ToastManager";
import axiosInstance from "../../lib/axiosIntance";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Bookmark,
  Edit2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import PostAction from "./PostAction";
import { Link, useParams } from "react-router-dom";
import Dialog from "../UI/Dialog";
import DropdownComponent from "../UI/DropdownComponent";
import UserTooltip from "../userTooltip";
import UserLinkWithTooltip from "../UserLinkWithTooltip";

export default function Post({ post }) {
  const { hashtag } = useParams();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [showComment, setShowComment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { addToast } = useToast();

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const isOwner = authUser?._id === post.author?._id;
  const isLiked = post.likes?.includes(authUser?._id);
  const isBookmarked = post.bookmarks?.includes(authUser?._id);

  const queryClient = useQueryClient();

  const { mutate: deletingPostMuation, isPending: isDeletingPost } = useMutation({
    mutationFn: async () => await axiosInstance.delete(`/posts/delete/${post._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      addToast("Post Deleted successfully", { type: "success", duration: 3000 });
    },
    onError: (error) => {
      addToast(error.message || "Failed to Delete Post", { type: "error", duration: 3000 });
    },
  });

  const { mutate: createCommentMuatation, isPending: isCommenting } = useMutation({
    mutationFn: async (newComment) =>
      await axiosInstance.post(`/posts/${post._id}/comment`, { content: newComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      addToast("Commented successfully", { type: "success", duration: 3000 });
    },
    onError: (error) => {
      addToast(error.message || "Failed to Comment", { type: "error", duration: 3000 });
    },
  });

  const { mutate: likingPostMuatation, isPending: isLiking } = useMutation({
    mutationFn: async () => await axiosInstance.post(`/posts/${post._id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["hashtagPosts", hashtag] });
    },
    onError: (error) => {
      addToast(error.message || "Failed to Like", { type: "error", duration: 3000 });
    },
  });

  const { mutate: bookmarkPostMuatation, isPending: isBookmarking } = useMutation({
    mutationFn: async () => await axiosInstance.post(`/posts/${post._id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["hashtagPosts", hashtag] });
      addToast(`🔖 Post bookmarked`, { type: "success", duration: 3000 });
    },
    onError: (error) => {
      addToast(error.message || "Failed to Bookmark", { type: "error", duration: 3000 });
    },
  });

  const handleLikePost = () => {
    if (isLiking) return;
    likingPostMuatation();
  };

  const handleBookmarkPost = () => {
    if (isBookmarking) return;
    bookmarkPostMuatation();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createCommentMuatation(newComment);
    setComments([
      ...comments,
      {
        content: newComment,
        user: {
          _id: authUser._id,
          name: authUser.name,
          avatar: authUser.avatar,
        },
        createdAt: new Date(),
      },
    ]);
    setNewComment("");
  };

  const handleDeletePost = () => {
    deletingPostMuation();
    setShowDeleteDialog(false);
  };

  const handleOptionSelect = (value) => {
    if (value === "delete") {
      setShowDeleteDialog(true);
    }
  };

  const options = [
    { label: "Edit", value: "edit", icon: <Edit2 />, href: "/posts/edit" },
    { label: "Delete", value: "delete", icon: <Trash2 /> },
  ];

 // Adjust import as needed



// Adjust import as needed

const highlightContent = (text) => {
  if (!text) return "";

  // Fix HTML escaping
  const escapedText = text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, `"`)
    .replace(/'/g, "'");

  // Highlight hashtags and mentions as HTML strings
  return escapedText.replace(
    /(#\w+)|(@\w+)/g,
    (match) =>
      match.startsWith("#")
        ? `<a href="/hashtag/${match.slice(1)}" class="text-blue-600 font-bold underline cursor-pointer">${match}</a>`
        : `<a href="/profile/${match.slice(1)}" class="text-teal-600 font-bold underline cursor-pointer">${match}</a>`
  );
};



  return (
    <article className="bg-white rounded-xl shadow-md border border-gray-200 mb-6 p-6 mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <UserTooltip user={post?.author} delay={0.2} minShowTime={2}>
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author?.username}`}>
              <img
                src={post.author?.avatar || "/placeholder.png"}
                alt={post.author?.name || "User"}
                className="w-14 h-14 rounded-full border-2 border-gray-200 object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </Link>
            <div>
              <Link to={`/profile/${post.author?.username}`}>
                <h3 className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">
                  {post.author?.name || "Unknown User"}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {post.author?.headline || ""}
              </p>
              <time className="text-xs text-gray-400 dark:text-gray-500">
                {formatDistanceToNowStrict(new Date(post.createdAt))} ago
              </time>
            </div>
          </div>
        </UserTooltip>
        {isOwner && (
        <div  style={{ position: "relative", zIndex: 1000 }}>
            <DropdownComponent
            triggerElement={
              <button
                variant="solid"
                size="sm"
                isIconOnly
                className="text-black"
              >
                <MoreHorizontal size={20} className="text-black" />
              </button>
            }
            options={options}
            className="shadow-lg rounded-md text-black"
            onSelect={handleOptionSelect}
            variant="default"
          />
        </div>
        )}
      </div>

      {/* Content */}
      <p
        className="text-gray-700 md:text-base text-sm mb-4 break-words leading-relaxed line-clamp-6"
        dangerouslySetInnerHTML={{ __html: highlightContent(post.content) }}
      />
      {post.image && (
        <div className="relative w-full max-w-lg mx-auto mb-4">
          <img
            src={post.image}
            alt="Post Image"
            className="w-full h-auto max-h-80 rounded-lg object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center border-t pt-3 mb-3">
        <PostAction
          icon={
            <ThumbsUp
              size={20}
              className={`transition-colors duration-200 ${isLiked ? "text-blue-600 fill-blue-600" : "text-gray-500"}`}
            />
          }
          text={`Like ${post.likes?.length || 0}`}
          onClick={handleLikePost}
          className={`hover:bg-blue-50 rounded-md px-3 py-2 transition-all duration-200 ${isLiked ? "text-blue-600 font-semibold" : ""}`}
        />
        <PostAction
          icon={
            <MessageCircle
              size={20}
              className={`text-gray-500 transition-colors duration-200 ${showComment ? "text-blue-600" : ""}`}
            />
          }
          text={`${comments.length}`}
          onClick={() => setShowComment(!showComment)}
          className="hover:bg-blue-50 rounded-md px-3 py-2 transition-all duration-200"
        />
        <PostAction
          icon={
            <Bookmark
              size={20}
              className={`transition-colors duration-200 ${isBookmarked ? "text-blue-600 fill-blue-600" : "text-gray-500"}`}
            />
          }
          text="Bookmark"
          onClick={handleBookmarkPost}
          className={`hover:bg-blue-50 rounded-md px-3 py-2 transition-all duration-200 ${isBookmarked ? "text-blue-600 font-semibold" : ""}`}
        />
        <PostAction
          icon={<Share size={20} className="text-gray-500" />}
          text="Share"
          className="hover:bg-blue-50 rounded-md px-3 py-2 transition-all duration-200"
        />
      </div>

      {/* Comments */}
      {showComment && (
        <div
          className={`transition-all duration-300 ease-in-out ${showComment ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
        >
          <div className="max-h-80 overflow-y-auto space-y-3 mb-4">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <img
                  src={comment.user?.avatar || "/placeholder.png"}
                  alt={comment.user?.name || "User"}
                  className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  loading="lazy"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">
                      {comment.user?.name || "Unknown"}
                    </span>
                    <time className="text-xs">
                      {formatDistanceToNowStrict(new Date(comment.createdAt))}
                    </time>
                  </div>
                  <p className="text-sm break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 p-3 rounded-full bg-gray-100 border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
            />
            <button
              type="submit"
              variant="solid"
              color="primary"
              size="sm"
              isLoading={isCommenting}
              isDisabled={!newComment.trim()}
              radius="full"
              isIconOnly
              spinner={<Loader2 className="animate-spin" />}
              className="bg-blue-600 hover:bg-blue-700 p-3 text-white"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        headline="Delete Post?"
        description="Are you sure you want to delete this post? This action cannot be undone."
        actionText="Delete"
        variant="destructive"
        isLoading={isDeletingPost}
        actionIcon={<Trash2 size={18} />}
        onAction={handleDeletePost}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
        actionButtonClass="bg-red-600 hover:bg-red-700 text-white"
        cancelButtonClass="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
      />
    </article>
  );
}