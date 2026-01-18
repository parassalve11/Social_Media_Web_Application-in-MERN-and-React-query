// components/Post/EditPostDialog.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Dialog from "../UI/Dialog";
import { Edit2, Image, X, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { motion as Motion, AnimatePresence } from "framer-motion";

export default function EditPostDialog({ post, showEditDialog, setShowEditDialog }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const contentEditableRef = useRef(null);

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { mutate: updatePostMutation, isPending: isUpdatePostLoading } = useMutation({
    mutationFn: async (updatedData) =>
      await axiosInstance.put(`/posts/edit/${post._id}`, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["posts", post._id] });

      addToast("✨ Post updated successfully", {
        type: "success",
        duration: 3000,
      });

      setShowEditDialog(false);
      setImage(null);
      setImagePreview(null);
    },
    onError: (error) => {
      addToast(error.message || "❌ Failed to update post", {
        type: "error",
        duration: 3000,
      });
    },
  });

  const highlightContent = (text) => {
    if (!text) return "";
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return escapedText.replace(
      /(#\w+)|(@\w+)/g,
      (match) =>
        match.startsWith("#")
          ? `<span class="text-blue-600 font-bold">${match}</span>`
          : `<span class="text-purple-600 font-bold">${match}</span>`
    );
  };

  const handleInput = (e) => {
    const text = e.currentTarget.textContent;
    setContent(text);
    const content = contentEditableRef.current?.innerText;
    setIsEmpty(!content?.trim());

    const range = document.createRange();
    const sel = window.getSelection();
    e.currentTarget.innerHTML = highlightContent(text);
    range.selectNodeContents(e.currentTarget);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      const preview = await readFileAsDataUrl(file);
      setImagePreview(preview);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleEditPost = async () => {
    try {
      const postData = { content };

      if (image) {
        postData.image = await readFileAsDataUrl(image);
      }

      updatePostMutation(postData);
    } catch (error) {
      console.log("Error in handleEditPost", error.message);
    }
  };

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (!showEditDialog) return;

    const initialContent = post?.content || "";
    setContent(initialContent);

    if (contentEditableRef.current) {
      contentEditableRef.current.innerText = initialContent;
      setIsEmpty(!initialContent.trim());
    }

    if (post?.image) {
      setImagePreview(post.image);
    }
  }, [showEditDialog, post?.content, post?.image]);

  return (
    <Dialog
      isOpen={showEditDialog}
      onClose={() => {
        setShowEditDialog(false);
        setImage(null);
        setImagePreview(null);
      }}
      actionIcon={<Edit2 size={18} />}
      actionText="Save Changes"
      headline="Edit Post"
      onAction={handleEditPost}
      isLoading={isUpdatePostLoading}
    >
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <Sparkles size={18} className="text-blue-600" />
          <p className="text-sm text-gray-600">
            Update your thoughts and share with your followers
          </p>
        </div>

        {/* Content Editor */}
        <div className="space-y-4">
          <div className="relative">
            <AnimatePresence>
              {isEmpty && !isFocused && (
                <Motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-0 text-gray-400 pointer-events-none select-none"
                >
                  What's on your mind?
                </Motion.div>
              )}
            </AnimatePresence>

            <div
              ref={contentEditableRef}
              contentEditable
              onInput={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[150px] text-gray-900 transition-all duration-200"
              role="textbox"
              aria-multiline="true"
              aria-label="Edit post content"
            />
          </div>

          {/* Image Preview */}
          <AnimatePresence>
            {imagePreview && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative rounded-xl overflow-hidden"
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-cover rounded-xl"
                />
                <Motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeImage}
                  className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur-sm text-white rounded-full p-2 hover:bg-gray-900 transition-all shadow-lg"
                  aria-label="Remove image"
                >
                  <X size={18} />
                </Motion.button>
              </Motion.div>
            )}
          </AnimatePresence>

          {/* Image Upload */}
          <label className="cursor-pointer">
            <Motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl transition-all duration-200 hover:bg-blue-50"
            >
              <Image size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-600">
                {imagePreview ? "Change photo" : "Add photo"}
              </span>
            </Motion.div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </Motion.div>
    </Dialog>
  );
}