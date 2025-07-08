import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance"; 
import { useToast } from "../components/UI/ToastManager";
import { Users } from "lucide-react";


function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 500); 
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch authenticated user
  const { data: authUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ["authUser"],
  });

  // Search users
  const { data: searchResults, isLoading: isSearchLoading, isError, error } = useQuery({
    queryKey: ["searchUsers", debouncedSearchQuery], // Use debounced query
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
      return res.data;
    },
    enabled: !!debouncedSearchQuery.trim(),
    onError: (err) => {
      console.error("Error fetching search results:", err.message);
      addToast("Failed to load search results", { type: "error", duration: 3000 });
    },
  });

  // Follow mutation
  const { mutate: followMutation, isPending: isFollowing } = useMutation({
    mutationFn: async (userId) => await axiosInstance.post(`/follows/${userId}/follow`),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["authUser"] });
      const previousAuthUser = queryClient.getQueryData(["authUser"]);
      queryClient.setQueryData(["authUser"], (old) =>
        old ? { ...old, following: [...(old.following || []), userId] } : old
      );
      return { previousAuthUser };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchUsers", searchQuery] });
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      addToast("Followed user", { type: "success", duration: 3000 });
    },
    onError: (error, userId, context) => {
      queryClient.setQueryData(["authUser"], context.previousAuthUser);
      console.error("Follow error:", error.message);
      addToast("Failed to follow user", { type: "error", duration: 3000 });
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["authUser"] });
    },
  });

  // Unfollow mutation
  const { mutate: unFollowMutation, isPending: isUnFollowing } = useMutation({
    mutationFn: async (userId) => await axiosInstance.post(`/follows/${userId}/unfollow`),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["authUser"] });
      const previousAuthUser = queryClient.getQueryData(["authUser"]);
      queryClient.setQueryData(["authUser"], (old) =>
        old ? { ...old, following: (old.following || []).filter((id) => id !== userId) } : old
      );
      return { previousAuthUser };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchUsers", searchQuery] });
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      addToast("Unfollowed user", { type: "success", duration: 3000 });
    },
    onError: (error, userId, context) => {
      queryClient.setQueryData(["authUser"], context.previousAuthUser);
      console.error("Unfollow error:", error.message);
      addToast("Failed to unfollow user", { type: "error", duration: 3000 });
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["authUser"] });
    },
  });

  const isDisabled = isFollowing || isUnFollowing;

  const getButtonText = (user) => {
    const isFollowingUser = authUser?.following?.includes(user._id);
    return isFollowingUser ? "Unfollow" : "Follow";
  };

  const getAriaLabel = (user) => {
    const isFollowingUser = authUser?.following?.includes(user._id);
    return isFollowingUser ? `Unfollow ${user.username}` : `Follow ${user.username}`;
  };

  // Handle search input with debounce
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:max-w-7xl w-full bg-white rounded-xl shadow-lg">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 md:mb-8">
        Search Users
      </h1>
      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by username or name..."
          className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          aria-label="Search users by username or name"
        />
      </div>
      {isAuthLoading || isSearchLoading ? (
        <div className="text-center text-gray-600 text-sm sm:text-base md:text-lg" aria-live="polite">
          Loading...
        </div>
      ) : isError ? (
        <div className="text-center text-red-600 text-sm sm:text-base md:text-lg" aria-live="assertive">
          Error: {error?.message || "Could not load search results"}
        </div>
      ) : !searchQuery.trim() ? (
        <div className="text-center text-gray-600 text-sm sm:text-base md:text-lg" aria-live="polite">
          Enter a search query to find users
        </div>
      ) : searchResults?.length > 0 ? (
        <ul className="space-y-3 sm:space-y-4 md:space-y-5" role="list">
          {searchResults.map((user) => (
            <li
              key={user._id}
              className="flex flex-row items-center justify-between p-3 sm:p-4 md:p-5 hover:bg-gray-100 rounded-lg transition-all duration-200"
              role="listitem"
            >
              <div className="flex items-center space-x-2 sm:space-x-3 w-auto min-w-0">
                <img
                  src={user.avatar || "https://via.placeholder.com/150"}
                  alt={`${user.username}'s avatar`}
                  className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover"
                />
                <Link
                  to={`/profile/${user.username}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded min-w-0"
                >
                  <div className="max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[250px]">
                    <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 truncate">
                      @{user.username || ""}
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 truncate line-clamp-1">
                      {user.bio || ""}
                    </p>
                  </div>
                </Link>
              </div>
              {user._id !== authUser?._id && (
                <button
                  onClick={() =>
                    authUser.following?.includes(user._id)
                      ? unFollowMutation(user._id)
                      : followMutation(user._id)
                  }
                  disabled={isDisabled}
                  className={`
                    px-2.5 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2 rounded-full font-medium text-xs sm:text-sm md:text-base
                    transition-all duration-200 ease-in-out min-w-[70px] sm:min-w-[90px] md:min-w-[100px]
                    ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-600"
                        : "hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    }
                    ${
                      authUser.following?.includes(user._id)
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }
                  `}
                  aria-label={getAriaLabel(user)}
                  aria-busy={isDisabled}
                >
                  {getButtonText(user)}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-white shadow-lg p-6 sm:p-8 rounded-xl text-center" aria-live="polite">
          <div className="mb-4 sm:mb-6">
            <Users size={40} className="text-blue-600 mx-auto sm:size-12 md:size-16" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            No Users Found
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-2">
            Try a different search query
          </p>
        </div>
      )}
    </div>
  );
}