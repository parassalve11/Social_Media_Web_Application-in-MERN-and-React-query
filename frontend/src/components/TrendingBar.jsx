import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axiosIntance";
import { Hash } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./UI/sidebar/context";
import { useToast } from "./UI/ToastManager";
import { useState } from "react";

const TrendingBar = () => {
  const { addToast } = useToast();
  const { isOpen, isMobile } = useSidebar();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: trendingHashtags, isLoading, error } = useQuery({
    queryKey: ["trendingHashtags"],
    queryFn: async () => {
      const response = await axiosInstance.get("/posts/trending-hashtags");
      return response.data.slice(0, 5);
    },
    staleTime: 5 * 60 * 1000,
    onError: (err) => {
      console.error("Error fetching trending hashtags:", err.message);
      addToast("Failed to load trending hashtags", { type: "error", duration: 3000 });
    },
  });

  const currentHashtag = location.pathname.split("/hashtag/")[1]?.toLowerCase();

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  if (isMobile) {
    return (
      <>
        <button
          onClick={toggleModal}
          className="flex items-center justify-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          aria-label="View trending hashtags"
        >
          <Hash className="h-6 w-6" />
          <span className="text-xs mt-1">Trending</span>
        </button>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacit
System: y-50 flex items-center justify-center z-50 md:hidden">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Trending Hashtags</h3>
                <button
                  onClick={toggleModal}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  aria-label="Close trending hashtags modal"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {isLoading && (
                <div className="text-center text-gray-500 animate-pulse" aria-live="polite">
                  Loading hashtags...
                </div>
              )}
              {error && (
                <div className="text-center text-red-500" aria-live="assertive">
                  Error loading hashtags
                </div>
              )}
              {!isLoading && !error && trendingHashtags?.length > 0 ? (
                <ul className="space-y-3 max-h-[200px] overflow-y-auto" role="list">
                  {trendingHashtags.map(({ hashtag, count }) => (
                    <li key={hashtag} role="listitem">
                      <Link
                        to={`/hashtag/${hashtag.slice(1)}`}
                        className={`flex justify-between items-center p-2 rounded-lg transition-all duration-200 text-sm ${
                          currentHashtag === hashtag.slice(1).toLowerCase()
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                            : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        }`}
                        aria-current={currentHashtag === hashtag.slice(1).toLowerCase() ? "true" : undefined}
                        onClick={() => setIsModalOpen(false)}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Hash className="h-4 w-4 shrink-0" />
                          <span className="truncate" title={hashtag}>
                            {hashtag}
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">{count} posts</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500" aria-live="polite">
                  No trending hashtags
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        {isOpen ? (
          <>
            <Hash className="h-5 w-5 text-blue-600" />
            Trending Hashtags
          </>
        ) : (
          <Hash className="h-5 w-5 mx-auto text-blue-600 animate-pulse" />
        )}
      </h3>
      {isLoading && isOpen && (
        <div className="text-center text-gray-500 animate-pulse" aria-live="polite">
          Loading hashtags...
        </div>
      )}
      {error && isOpen && (
        <div className="text-center text-red-500" aria-live="assertive">
          Error loading hashtags
        </div>
      )}
      {!isLoading && !error && trendingHashtags?.length > 0 && isOpen && (
        <ul className="space-y-2 max-h-[200px] overflow-y-auto" role="list">
          {trendingHashtags.map(({ hashtag, count }) => (
            <li key={hashtag} role="listitem">
              <Link
                to={`/hashtag/${hashtag.slice(1)}`}
                className={`flex justify-between items-center p-2 rounded-lg transition-all duration-200 text-sm group ${
                  currentHashtag === hashtag.slice(1).toLowerCase()
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                }`}
                aria-current={currentHashtag === hashtag.slice(1).toLowerCase() ? "true" : undefined}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="truncate font-bold" title={hashtag}>
                    {hashtag}
                  </span>
                </span>
                <span className="text-xs text-black group-hover:text-gray-600">
                  {count} {count === 1 ? "post" : "posts"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !error && trendingHashtags?.length === 0 && isOpen && (
        <div className="text-center text-gray-500 text-sm" aria-live="polite">
          No trending hashtags
        </div>
      )}
    </div>
  );
};

export default TrendingBar;