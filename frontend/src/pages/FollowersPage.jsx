import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../lib/axiosIntance";
import { useToast } from "../components/UI/ToastManager";

export default function FollowersPage() {
  const { username } = useParams();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data: authUser, isLoading: isAuthLoading } = useQuery({
    queryKey: ["authUser"],
  });

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => await axiosInstance.get(`/users/${username}`),
  });

  const isOwnProfile = authUser?.username === userProfile?.data.username;
  const userData = userProfile?.data;

  const {
    data: followers,
    isLoading: isFollowersLoading,
    isError: isFollowersError,
    error: followersError,
  } = useQuery({
    queryKey: ["followers", username],
    queryFn: async () => {
      const res = await axiosInstance.get(`/follows/${userData._id}/followers`);
      return res.data;
    },
    enabled: !!userData?._id,
    onError: (err) => {
      console.error("Error fetching followers:", err.message);
      addToast("Failed to load followers", { type: "error", duration: 3000 });
    },
  });

  const { mutate: followMutation, isPending: isFollowing } = useMutation({
    mutationFn: async (userId) =>
      await axiosInstance.post(`follows/${userId}/follow`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers", username] });
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      addToast("Followed user", { type: "success", duration: 3000 });
    },
    onError: (error) => {
      console.error("Follow error:", error.message);
      addToast("Failed to follow user", { type: "error", duration: 3000 });
    },
  });

  const { mutate: unFollowMutation, isPending: isUnFollowing } = useMutation({
    mutationFn: async (userId) =>
      await axiosInstance.post(`follows/${userId}/unfollow`),
    onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ["followers", username] });
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      addToast("Unfollowed user", { type: "success", duration: 3000 });
  
    },
    onError: (error) => {
      console.error("Unfollow error:", error.message);
      addToast("Failed to unfollow user", { type: "error", duration: 3000 });
    },
  });

  const isDisabled = isFollowing || isUnFollowing;

  const getButtonText = (follower) => {
    const isFollower = authUser?.following?.includes(follower._id);
    return isFollower ? "Unfollow" : "Follow";
  };

  const getAriaLabel = (follower) => {
    const isFollower = authUser?.following?.includes(follower._id);
    return isFollower ? `Unfollow ${follower.username}` : `Follow ${follower.username}`;
  };

  // Debug logs
 

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:max-w-5xl w-full bg-white rounded-xl shadow-lg">
      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 md:mb-8">
        {isOwnProfile ? "Your Followers" : `${userData?.username}'s Followers`}
      </h1>
      {isAuthLoading || isProfileLoading || isFollowersLoading ? (
        <div className="text-center text-gray-600 text-sm sm:text-base md:text-lg" aria-live="polite">
          Loading followers...
        </div>
      ) : isFollowersError ? (
        <div className="text-center text-red-600 text-sm sm:text-base md:text-lg" aria-live="assertive">
          Error: {followersError?.message || "Could not load followers"}
        </div>
      ) : followers?.length > 0 ? (
        <ul className="space-y-3 sm:space-y-4 md:space-y-5" role="list">
          {followers.map((follower) => (
            <li
              key={follower._id}
              className="flex flex-row items-center justify-between p-3 sm:p-4 md:p-5 hover:bg-gray-100 rounded-lg transition-all duration-200"
              role="listitem"
            >
              <div className="flex items-center space-x-2 sm:space-x-3 w-auto min-w-0">
                <img
                  src={follower.avatar || "https://via.placeholder.com/150"}
                  alt={`${follower.username}'s avatar`}
                  className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover"
                />
                <Link
                  to={`/profile/${follower.username}`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded min-w-0"
                >
                  <div className="max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[250px]">
                    <p className="font-medium text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg truncate">
                      {follower.name}
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 truncate">
                      @{follower.username || ""}
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 truncate line-clamp-1">
                      {follower.bio || ""}
                    </p>
                  </div>
                </Link>
              </div>
              {follower._id !== authUser?._id && authUser._id !== userData._id && (
                <button
                  onClick={() =>
                    authUser.following?.includes(follower._id)
                      ? unFollowMutation(follower._id)
                      : followMutation(follower._id)
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
                      authUser.following?.includes(follower._id)
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }
                  `}
                  aria-label={getAriaLabel(follower)}
                  aria-busy={isDisabled}
                >
                  {getButtonText(follower)}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-600 text-sm sm:text-base md:text-lg" aria-live="polite">
          No followers yet
        </div>
      )}
    </div>
  );
}