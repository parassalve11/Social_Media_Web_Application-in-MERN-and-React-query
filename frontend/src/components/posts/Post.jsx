import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "../UI/ToastManager";
import axiosInstance from "../../lib/axiosIntance";
import { formatDistanceToNowStrict } from "date-fns";
import {
  Bookmark,
  Edit2,
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
import UserTooltip from "../UserTooltip.jsx";
import EditPostDialog from "./EditPostDialog";

export default function Post({ post }) {
  const { hashtag } = useParams();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const [showComment, setShowComment] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { addToast } = useToast();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const isOwner = authUser?._id === post.author?._id;
  const isLiked = post.likes?.includes(authUser?._id);
  const isBookmarked = post.bookmarks?.includes(authUser?._id);

  const { mutate: deletingPostMuation, isPending: isDeletingPost } =
    useMutation({
      mutationFn: async () =>
        await axiosInstance.delete(`/posts/delete/${post._id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["for-you"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
        queryClient.invalidateQueries({ queryKey: ["posts", post._id] });
        addToast("Post Deleted successfully", {
          type: "success",
          duration: 3000,
        });
      },
      onError: (error) => {
        addToast(error.message || "Failed to Delete Post", {
          type: "error",
          duration: 3000,
        });
      },
    });

  const { mutate: createCommentMuatation, isPending: isCommenting } =
    useMutation({
      mutationFn: async (newComment) =>
        await axiosInstance.post(`/posts/${post._id}/comment`, {
          content: newComment,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["for-you"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
        queryClient.invalidateQueries({ queryKey: ["posts", post._id] });
        addToast("Commented successfully", { type: "success", duration: 3000 });
      },
      onError: (error) => {
        addToast(error.message || "Failed to Comment", {
          type: "error",
          duration: 3000,
        });
      },
    });

  const { mutate: likingPostMuatation, isPending: isLiking } = useMutation({
    mutationFn: async () => await axiosInstance.post(`/posts/${post._id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });
      queryClient.invalidateQueries({ queryKey: ["hashtagPosts", hashtag] });
    },
    onError: (error) => {
      addToast(error.message || "Failed to Like", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const { mutate: bookmarkPostMuatation, isPending: isBookmarking } =
    useMutation({
      mutationFn: async () =>
        await axiosInstance.post(`/posts/${post._id}/bookmark`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["for-you"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
        queryClient.invalidateQueries({ queryKey: ["posts", post._id] });
        queryClient.invalidateQueries({ queryKey: ["hashtagPosts", hashtag] });
        addToast(`🔖 Post bookmarked`, { type: "success", duration: 3000 });
      },
      onError: (error) => {
        addToast(error.message || "Failed to Bookmark", {
          type: "error",
          duration: 3000,
        });
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
    } else if (value === "edit") {
      setShowEditDialog(true);
    }
  };

  const options = [
    { label: "Edit", value: "edit", icon: <Edit2 /> },
    { label: "Delete", value: "delete", icon: <Trash2 /> },
  ];

  const highlightContent = (text) => {
    if (!text) return "";

    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    return escapedText.replace(/(#\w+)|(@\w+)/g, (match) =>
      match.startsWith("#")
        ? `<a href="/hashtag/${match.slice(
            1
          )}" class="text-blue-500 hover:text-blue-600 font-medium underline decoration-2 underline-offset-4 cursor-pointer transition-colors duration-200">${match}</a>`
        : `<a href="/profile/${match.slice(
            1
          )}" class="text-gray-500 hover:text-gray-600 font-medium underline decoration-2 underline-offset-4 cursor-pointer transition-colors duration-200">${match}</a>`
    );
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 mx-auto max-w-md sm:max-w-lg transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <UserTooltip user={post?.author} delay={0.2} minShowTime={1}>
            <Link to={`/profile/${post.author?.username}`}>
              <img
                src={post.author?.avatar || "/placeholder.png"}
                alt={post.author?.name || "User"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-md hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </Link>
          </UserTooltip>
          <div className="min-w-0 flex-1">
            <Link to={`/profile/${post.author?.username}`}>
              <h3 className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors duration-200">
                {post.author?.name || "Unknown User"}
              </h3>
            </Link>
            <Link
              to={`/profile/${post.author?.username}`}
              className="block text-xs text-gray-500 hover:text-gray-600 transition-colors duration-200"
            >
              @{post.author?.username || ""}
            </Link>
            <time className="block text-xs text-gray-400 mt-1">
              {formatDistanceToNowStrict(new Date(post.createdAt))} ago
            </time>
          </div>
        </div>
        {isOwner && (
          <DropdownComponent
            triggerElement={
              <PostAction
                icon={<MoreHorizontal size={18} className="text-gray-500" />}
                text=""
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              />
            }
            options={options}
            className="shadow-lg rounded-xl text-gray-900"
            onSelect={handleOptionSelect}
            variant="default"
          />
        )}
      </div>

      {/* Content */}
      <Link to={`/post/${post._id}`} className="block">
        <div className="px-4 pb-4">
          <p
            className="text-gray-800 text-sm leading-6 mb-3 break-words"
            dangerouslySetInnerHTML={{ __html: highlightContent(post.content) }}
          />
        </div>

        {post.image && (
          <div className="relative overflow-hidden rounded-b-2xl">
            <img
              src={post.image}
              alt="Post Image"
              className="w-full aspect-[1.2] object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
      </Link>

      {/* Actions */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
        <PostAction
          icon={
            <ThumbsUp
              size={18}
              className={`transition-all duration-200 ${
                isLiked ? "text-red-500 fill-red-500 scale-110" : "text-gray-500"
              }`}
            />
          }
          text={post.likes?.length ? `${post.likes.length}` : ""}
          onClick={handleLikePost}
          className={`group rounded-full px-3 py-2 transition-all duration-200 ${
            isLiked
              ? "text-red-500 font-semibold"
              : "hover:bg-red-50 hover:text-red-500"
          }`}
        />
        <PostAction
          icon={
            <MessageCircle
              size={18}
              className={`transition-colors duration-200 ${
                showComment ? "text-blue-500 fill-blue-500" : "text-gray-500"
              }`}
            />
          }
          text={comments.length ? `${comments.length}` : ""}
          onClick={() => setShowComment(!showComment)}
          className="rounded-full px-3 py-2 hover:bg-blue-50 hover:text-blue-500 transition-all duration-200"
        />
        <PostAction
          icon={
            <Bookmark
              size={18}
              className={`transition-all duration-200 ${
                isBookmarked ? "text-purple-500 fill-purple-500 scale-110" : "text-gray-500"
              }`}
            />
          }
          text=""
          onClick={handleBookmarkPost}
          className={`rounded-full px-3 py-2 transition-all duration-200 ${
            isBookmarked
              ? "text-purple-500 font-semibold"
              : "hover:bg-purple-50 hover:text-purple-500"
          }`}
        />
        <PostAction
          icon={<Share size={18} className="text-gray-500" />}
          text=""
          className="rounded-full px-3 py-2 hover:bg-gray-50 hover:text-gray-600 transition-all duration-200"
        />
      </div>

      {/* Comments */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          showComment ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-h-64 overflow-y-auto px-4 pb-4 space-y-3">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
            >
              <img
                src={comment.user?.avatar || "/placeholder.png"}
                alt={comment.user?.name || "User"}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-white shadow-sm flex-shrink-0 mt-0.5"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {comment.user?.name || "Unknown"}
                  </span>
                  <time className="text-xs text-gray-400">
                    {formatDistanceToNowStrict(new Date(comment.createdAt))}
                  </time>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
        {showComment && (
          <form onSubmit={handleAddComment} className="flex items-center gap-2 px-4 pb-4 bg-gray-50 rounded-b-2xl">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 p-3 rounded-full bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isCommenting}
              className={`p-3 rounded-full transition-all duration-200 ${
                newComment.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        headline="Delete Post?"
        description="This can't be undone and it will be removed from your profile, any edits, and actions will be gone."
        actionText="Delete"
        variant="destructive"
        isLoading={isDeletingPost}
        actionIcon={<Trash2 size={18} />}
        onAction={handleDeletePost}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm mx-auto"
        actionButtonClass="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-3 font-medium"
        cancelButtonClass="bg-white hover:bg-gray-50 text-gray-900 rounded-xl px-6 py-3 font-medium border border-gray-200"
      />
      <EditPostDialog
        post={post}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
      />
    </article>
  );
}