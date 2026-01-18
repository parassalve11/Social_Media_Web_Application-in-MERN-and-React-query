import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance";
import { useToast } from "../components/UI/ToastManager";
import { Users } from "lucide-react";
import FollowButton from "../components/FollowButton";
import { useQueryClient } from "@tanstack/react-query"; // adjust path to your query client export
import { store } from "../store"; // read initial snapshot without subscribing

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const { addToast } = useToast();


  const queryClient = useQueryClient()
  // ---------- local following map (no subscription to Redux)
  // initialize from store snapshot once
  const initialFollowingMapRef = useRef(
    Object.fromEntries((store.getState().user.user?.following || []).map((id) => [id, true]))
  );
  const [localFollowingMap, setLocalFollowingMap] = useState(initialFollowingMapRef.current);

  const { data: searchResults = [], isLoading: isSearchLoading, isError, error } = useQuery({
    queryKey: ["searchUsers", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];
      const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
      return res.data;
    },
    enabled: !!debouncedSearchQuery.trim(),
    keepPreviousData: true, // helpful for UX while typing
    onError: (err) => {
      console.error("Error fetching search results:", err.message);
      addToast("Failed to load search results", { type: "error", duration: 3000 });
    },
  });

  // ---------- Follow mutation (optimistic local update)
  const followMutation = useMutation({
    mutationFn: async (userId) => {
      return axiosInstance.post(`/follows/${userId}/follow`);
    },
    onMutate: async (userId) => {
      // cancel ongoing queries for this key to avoid conflicts
      await queryClient.cancelQueries({ queryKey: ["searchUsers", debouncedSearchQuery] });

      // snapshot previous search results
      const previousSearch = queryClient.getQueryData(["searchUsers", debouncedSearchQuery]);

      // optimistic update: update searchResults cache and localFollowingMap
      queryClient.setQueryData(["searchUsers", debouncedSearchQuery], (old = []) =>
        old.map((u) => (u._id === userId ? { ...u, __isFollowing: true } : u))
      );

      setLocalFollowingMap((prev) => ({ ...prev, [userId]: true }));

      // return rollback context
      return { previousSearch };
    },
    onError: (err, userId, context) => {
      // rollback cache
      queryClient.setQueryData(["searchUsers", debouncedSearchQuery], context.previousSearch);
      setLocalFollowingMap((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      console.error("Follow error:", err.message);
      addToast("Failed to follow user", { type: "error", duration: 3000 });
    },
    onSettled: () => {
      // don't refetch authUser or searchUsers — keep local UI stable
      // optionally you can refresh any global counts in background
    },
    onSuccess: () => {
      addToast("Followed user", { type: "success", duration: 2000 });
    },
  });

  // ---------- Unfollow mutation (optimistic local update)
  const unFollowMutation = useMutation({
    mutationFn: async (userId) => await axiosInstance.post(`/follows/${userId}/unfollow`),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["searchUsers", debouncedSearchQuery] });
      const previousSearch = queryClient.getQueryData(["searchUsers", debouncedSearchQuery]);

      queryClient.setQueryData(["searchUsers", debouncedSearchQuery], (old = []) =>
        old.map((u) => (u._id === userId ? { ...u, __isFollowing: false } : u))
      );

      setLocalFollowingMap((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });

      return { previousSearch };
    },
    onError: (err, userId, context) => {
      queryClient.setQueryData(["searchUsers", debouncedSearchQuery], context.previousSearch);
      setLocalFollowingMap((prev) => ({ ...prev, [userId]: true }));
      console.error("Unfollow error:", err.message);
      addToast("Failed to unfollow user", { type: "error", duration: 3000 });
    },
    onSettled: () => {
      // keep local UI stable — no forced refetch
    },
    onSuccess: () => {
      addToast("Unfollowed user", { type: "success", duration: 2000 });
    },
  });

  const isDisabled = followMutation.isLoading || unFollowMutation.isLoading;

  // Controlled follow handlers passed into FollowButton
  const handleFollow = (userId) => followMutation.mutate(userId);
  const handleUnfollow = (userId) => unFollowMutation.mutate(userId);

  // Helper to determine follow state for a listed user:
  // Prefer local __isFollowing flag (from optimistic cache), then localFollowingMap as fallback, then fallback false.
  const isFollowingFor = (user) => {
    // check cached searchResults (preferred) to see if we already annotated it
    const cached = queryClient.getQueryData(["searchUsers", debouncedSearchQuery]) || [];
    const item = cached.find((u) => u._id === user._id);
    if (item && typeof item.__isFollowing !== "undefined") return !!item.__isFollowing;
    return !!localFollowingMap[user._id];
  };

  // UI handlers
  const handleSearch = (e) => setSearchQuery(e.target.value);

  return (
    <div className="mx-auto px-4 py-6 ...">
      <h1 className="text-lg ...">Search Users</h1>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search by username or name..."
          className="w-full px-4 py-2 border rounded-lg"
          aria-label="Search users by username or name"
        />
      </div>

      {isSearchLoading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : isError ? (
        <div className="text-center text-red-600">Error: {error?.message || "Could not load search results"}</div>
      ) : !searchQuery.trim() ? (
        <div className="text-center text-gray-600">Enter a search query to find users</div>
      ) : searchResults?.length > 0 ? (
        <ul className="space-y-3">
          {searchResults.map((user) => {
            const isFollowing = isFollowingFor(user);
            return (
              <li key={user._id} className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src={user.avatar || "https://via.placeholder.com/150"} alt={`${user.username}'s avatar`} className="w-12 h-12 rounded-full object-cover"/>
                  <Link to={`/profile/${user.username}`} className="truncate">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </Link>
                </div>

                {user._id !== store.getState().user.user?._id && (
                  <FollowButton
                    userId={user._id}
                    isFollowing={isFollowing}
                    onFollow={() => handleFollow(user._id)}
                    onUnfollow={() => handleUnfollow(user._id)}
                    disabled={isDisabled}
                  />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bg-white shadow-lg p-6 rounded-xl text-center">
          <Users size={40} className="text-blue-600 mx-auto" />
          <h2 className="text-lg font-bold">No Users Found</h2>
          <p className="text-sm text-gray-600 mt-2">Try a different search query</p>
        </div>
      )}
    </div>
  );
}
