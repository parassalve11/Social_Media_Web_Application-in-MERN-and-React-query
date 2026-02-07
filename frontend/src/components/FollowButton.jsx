// components/FollowButton.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../lib/axiosIntance";
import { getSocket } from "../services/chat.service";
import { store } from "../store"; // snapshot only (no subscription)

export default function FollowButton({
  userId,
  // Controlled props (if provided, follow/unfollow will be handled by parent)
  isFollowing: isFollowingProp,
  onFollow,
  onUnfollow,
  disabled: disabledProp,
  className = "",
}) {
  const isControlled = typeof isFollowingProp !== "undefined";
  const [localIsFollowing, setLocalIsFollowing] = useState(() => {
    if (isControlled) return !!isFollowingProp;
    return !!store.getState().user.user?.following?.includes(userId);
  });
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (isControlled) {
      setLocalIsFollowing(!!isFollowingProp);
    }
  }, [isControlled, isFollowingProp]);

  useEffect(() => {
    if (!isControlled) {
      setLocalIsFollowing(
        !!store.getState().user.user?.following?.includes(userId)
      );
    }
  }, [isControlled, userId]);

  const isFollowing = isControlled ? isFollowingProp : localIsFollowing;
  const isDisabled =
    typeof disabledProp !== "undefined" ? disabledProp : localLoading;

  const handleClick = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (isDisabled || !userId) return;
    if (isControlled) {
      isFollowing ? onUnfollow?.() : onFollow?.();
    } else {
      const next = !isFollowing;
      setLocalIsFollowing(next);
      setLocalLoading(true);
      try {
        if (next) {
          await axiosInstance.post(`/follows/${userId}/follow`);
        } else {
          await axiosInstance.post(`/follows/${userId}/unfollow`);
        }

        const socket = getSocket();
        const authUserId = store.getState().user.user?._id;
        if (socket && authUserId) {
          socket.emit(next ? "follow_user" : "unfollow_user", {
            followerId: authUserId,
            followedId: userId,
          });
        }
      } catch (error) {
        setLocalIsFollowing(!next);
        console.error("Follow action failed:", error);
      } finally {
        setLocalLoading(false);
      }
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
          isDisabled
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
