// src/components/HashtagPosts.jsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance";
import { useToast } from "./UI/ToastManager"; 
import { useEffect, useState } from "react";
import Post from "./posts/Post";
import PostSkeleton from "./posts/PostSkeleton";

const HashtagPosts = () => {
  const { hashtag } = useParams(); 
  const { addToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);



  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hashtagPosts", hashtag],
    queryFn: async () => {
      const response = await axiosInstance.get(`/posts/hashtag/${hashtag}`, {
        params: { cursor: nextCursor },
      });
      return response.data;
      
    },
    
    onError: (err) => {
      console.error("Error fetching hashtag posts:", err.message);
      addToast(`Failed to load posts for #${hashtag}`, { type: "error", duration: 3000 });
    },
    enabled: !!hashtag, // Only run if hashtag exists
  });

  useEffect(() => {
    if (data) {
      setPosts((prev) => (nextCursor ? [...prev, ...data.posts] : data.posts));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
  }, [data]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      // Trigger query with updated cursor by setting nextCursor
      // useQuery will automatically refetch due to queryKey change
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
       <span className="font-bold text-4xl text-blue-500">#{hashtag}</span>
      </h1>
      {isLoading && !posts.length && (
        <div className="text-center text-gray-500 animate-pulse" aria-live="polite">
          Loading posts...
        </div>
      )}
      {isError && (
        <div className="text-center text-red-500" aria-live="assertive">
          Error: {error?.message || "Could not load posts"}
        </div>
      )}
      {posts.length > 0 ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          {posts.map((post) => (
           <div  key={post.author}>
            <Post post={post} />
           </div>
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isLoading}
              className={`mx-auto block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? <PostSkeleton /> : "Load More"}
            </button>
          )}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center text-gray-500" aria-live="polite">
            No posts found for <span className="font-bold text-3xl text-blue-500">#{hashtag}</span>
          </div>
        )
      )}
    </div>
  );
};

export default HashtagPosts;