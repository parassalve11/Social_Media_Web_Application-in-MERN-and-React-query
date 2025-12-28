import { useFollow } from "../store/follow/useFollow"; 
import { useUser } from "../store/user/useUser"; 

export default function FollowButton({ userId }) {
  const { user } = useUser(); // authenticated user

  const {
    followUser,
    unfollowUser,
    loading,
  } = useFollow();

  const isFollower = user?.following?.includes(userId);
  const isDisabled = loading;

  const handleClick = () => {
    if (isFollower) {
      unfollowUser(userId);
    } else {
      followUser(userId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        px-2.5 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2
        rounded-full font-medium text-xs sm:text-sm md:text-base
        transition-all duration-200 ease-in-out
        min-w-[70px] sm:min-w-[90px] md:min-w-[100px]
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
      aria-label={isFollower ? "Unfollow user" : "Follow user"}
      aria-busy={isDisabled}
    >
      {isFollower ? "Unfollow" : "Follow"}
    </button>
  );
}
