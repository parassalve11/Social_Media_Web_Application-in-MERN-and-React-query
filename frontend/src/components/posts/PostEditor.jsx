// components/Post/PostEditor.jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { Image, Loader2, X, Sparkles, Send } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

export default function PostEditor({ user }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const contentEditableRef = useRef(null);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: createPostMutation, isPending } = useMutation({
    mutationFn: async (postData) => {
      const res = await axiosInstance.post("/posts/create", postData, {
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["for-you"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      addToast("✨ Post created successfully", {
        type: "success",
        duration: 3000,
      });
      resetForm();
    },
    onError: (error) => {
      addToast("❌ Failed to create post", {
        type: "error",
        duration: 3000,
      });
      console.error("Mutation error:", error.message);
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

  const handlePostCreation = async () => {
    try {
      const postData = { content };

      if (image) {
        postData.image = await readFileAsDataURL(image);
      }

      createPostMutation(postData);
    } catch (error) {
      console.error("Error in handlePostCreation:", error.message);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImage(file);

    if (file) {
      const preview = await readFileAsDataURL(file);
      setImagePreview(preview);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setContent("");
    setImage(null);
    setImagePreview(null);
    setIsEmpty(true);
    setIsFocused(false);
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = "";
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const isPostDisabled = content.trim() === "" && !image;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md border border-gray-200 mb-6 overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Create a post</h3>
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-4">
          {/* Avatar */}
          <Motion.img
            whileHover={{ scale: 1.05 }}
            src={user.avatar || "/avatar.png"}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-200 shadow-sm flex-shrink-0"
          />

          {/* Content Editor */}
          <div className="flex-1">
            <div className="relative">
              <AnimatePresence>
                {isEmpty && !isFocused && (
                  <Motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-0 top-0 text-gray-400 pointer-events-none select-none text-base"
                  >
                    What's on your mind, {user.name?.split(" ")[0]}?
                  </Motion.div>
                )}
              </AnimatePresence>

              <div
                ref={contentEditableRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full p-0 bg-transparent focus:outline-none min-h-[100px] text-gray-900 text-base leading-relaxed transition-all duration-200 ${
                  isFocused ? "placeholder-transparent" : ""
                }`}
                role="textbox"
                aria-multiline="true"
                aria-label="Post content"
              />
            </div>
          </div>
        </div>

        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 relative rounded-xl overflow-hidden"
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

        {/* Actions Bar */}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <Motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
              >
                <Image size={20} />
                <span className="text-sm">Photo</span>
              </Motion.div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <Motion.button
            whileHover={{ scale: isPostDisabled ? 1 : 1.05 }}
            whileTap={{ scale: isPostDisabled ? 1 : 0.95 }}
            disabled={isPostDisabled || isPending}
            onClick={handlePostCreation}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md ${
              isPostDisabled || isPending
                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Post</span>
              </>
            )}
          </Motion.button>
        </div>
      </div>
    </Motion.div>
  );
}