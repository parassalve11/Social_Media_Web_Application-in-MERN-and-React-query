// components/FollowButton.jsx
import React from "react";
import { useFollow } from "../store/follow/useFollow";
import { useIsFollowing } from "../store/user/useUser"; // optional fallback

export default function FollowButton({
  userId,
  // Controlled props (if provided, follow/unfollow will be handled by parent)
  isFollowing: isFollowingProp,
  onFollow,
  onUnfollow,
  disabled: disabledProp,
  className = "",
}) {
  // fallback to internal hooks only when controlled props are not provided
  const { followUser, unfollowUser, loading } = useFollow();
  const isFollowingInternal = useIsFollowing ? useIsFollowing(userId) : undefined;

  const isControlled = typeof isFollowingProp !== "undefined";
  const isFollowing = isControlled ? isFollowingProp : isFollowingInternal;
  const isDisabled = typeof disabledProp !== "undefined" ? disabledProp : loading;

  const handleClick = () => {
    if (isControlled) {
      isFollowing ? onUnfollow?.() : onFollow?.();
    } else {
      isFollowing ? unfollowUser(userId) : followUser(userId);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        px-2.5 py-1 sm:px-4 sm:py-1.5 md:px-5 md:py-2
        rounded-full font-medium text-xs sm:text-sm md:text-base
        transition-all duration-200 ease-in-out
        min-w-[70px] sm:min-w-[90px] md:min-w-[100px]
        ${
          loading
            ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-600"
            : "hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        }
        ${
          isFollowing
            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }
      ${className}`}
      aria-label={isFollowing ? "Unfollow user" : "Follow user"}
      aria-busy={isDisabled}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
