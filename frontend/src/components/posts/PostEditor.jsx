import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import axiosInstance from "../../lib/axiosIntance";
import { useToast } from "../UI/ToastManager";
import { Image, Loader2, X } from "lucide-react";
import Button from "../UI/Button";

export default function PostEditor({ user }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);
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
      addToast("Post created successfully", {
        type: "success",
        duration: 3000,
      });
      resetForm();
    },
    onError: (error) => {
      addToast("Failed to create post", {
        type: "error",
        duration: 3000,
      });
      console.error("Mutation error:", error.message);
    },
  });

  const highlightContent = (text) => {
    if (!text) return "";
    // Escape HTML to prevent XSS
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    // Highlight hashtags and mentions
    return escapedText.replace(
      /(#\w+)|(@\w+)/g,
      (match) =>
        match.startsWith("#")
           ? `<a href="/hashtag/${match.slice(1)}" class="text-blue-600 font-bold underline cursor-pointer ">${match}</a>`
        : `<a href="/profile/${match.slice(1)}" class="text-teal-600 font-bold underline cursor-pointer">${match}</a>`
    );
  };

  const handleInput = (e) => {
    const text = e.currentTarget.textContent;
    setContent(text);
    const content = contentEditableRef.current?.innerText;
    setIsEmpty(!content?.trim());
    // Restore cursor position after re-rendering
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

  return (
    <div className="bg-[var(--theme-background)] rounded-lg shadow mb-4 p-4">
      <div className="flex space-x-3">
        <img
          src={user.avatar || "/avatar.png"}
          alt={user.name}
          className="size-12 rounded-full"
        />
       <div className="relative w-full max-w-sm lg:max-w-xl">
      {isEmpty && (
        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none select-none">
          What's on your mind?
        </div>
      )}
      <div
        ref={contentEditableRef}
        contentEditable
        onInput={handleInput}
        className="w-full p-3 rounded-lg bg-[var(--theme-background)] hover:bg-[var(--color-gray-100)] focus:bg-[var(--color-gray-100)] focus:outline-none min-h-[100px] text-gray-700 transition-colors duration-200"
        role="textbox"
        aria-multiline="true"
      />
    </div>
      </div>
      {imagePreview && (
        <div className="mt-4 relative max-w-md mx-auto">
          <img
            src={imagePreview}
            alt="Selected"
            className="w-full h-auto max-h-64 object-contain rounded-lg"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 transition-colors"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-4">
          <label className="flex items-center text-[var(--theme-blue)] hover:text-[var(--color-blue-600)] transition-colors duration-200 cursor-pointer">
            <Image size={20} className="mr-2" />
            <span>Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
        <Button
          variant="solid"
          color="primary"
          size="sm"
          isLoading={isPending}
          isDisabled={content.trim() === "" && !image}
          radius="sm"
          startContent={<span>🚀</span>}
          onClick={() => handlePostCreation()}
          spinner={<Loader2 className="animate-spin" />}
        >
          Post
        </Button>
      </div>
    </div>
  );
}