import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axiosIntance";


export default function FollowButton({ userId }) {
  const queryClient = useQueryClient();
  

  // Fetch authenticated user data
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
  });

  // Mutation for following a user
  const { mutate: followMutation, isPending: isFollowing } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(`/follows/${userId}/follow`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
    
    },
    onError: (error) => {
      console.error("Follow error:", error.message);
     
    },
  });

  // Mutation for unfollowing a user
  const { mutate: unFollowMutation, isPending: isUnFollowing } = useMutation({
    mutationFn: async () => {
      const res = await axiosInstance.post(`/follows/${userId}/unfollow`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["follow"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["recommendedUsers"] });
     
    },
    onError: (error) => {
      console.error("Unfollow error:", error.message);
     
    },
  });

  // Determine if the authenticated user is following the target user
  const isFollower = authUser?.following?.includes(userId);

  // Button text and ARIA label
  const getButtonText = () => (isFollower ? "Unfollow" : "Follow");
  const getAriaLabel = () => (isFollower ? `Unfollow user` : `Follow user`);

  const isDisabled = isFollowing || isUnFollowing;

  return (
    <button
      onClick={() => (isFollower ? unFollowMutation() : followMutation())}
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
          isFollower
            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }
      `}
      aria-label={getAriaLabel()}
      aria-busy={isDisabled}
    >
      {getButtonText()}
    </button>
  );
}