import { useDispatch, useSelector } from "react-redux";
import {
  getFollowers,
  getFollowing,
  followUser as followUserThunk,
  unfollowUser as unfollowUserThunk,
} from "./followThunks";
import { incrementFollowers, decrementFollowers } from "./followSlice";
import { setUser } from "../user/userSlice"; // auth user slice
import { getSocket } from "../../services/chat.service";

export const useFollow = () => {
  const dispatch = useDispatch();
  const follow = useSelector((state) => state.follow);
  const userState = useSelector((state) => state.user);

  return {
    /* ---------- STATE ---------- */
    followers: follow.followers,
    following: follow.following,
    followersCount: follow.followersCount,
    followingCount: follow.followingCount,
    loading: follow.loading,
    error: follow.error,

    /* ---------- API ACTIONS ---------- */
    getFollowers: (userId) => dispatch(getFollowers(userId)),
    getFollowing: (userId) => dispatch(getFollowing(userId)),

    followUser: async (userId) => {
      // Optimistic UI: update auth user
      const updatedUser = {
        ...userState.user,
        following: [...(userState.user.following || []), userId],
      };
      dispatch(setUser(updatedUser));

      // Update follow slice (optional)
      dispatch(incrementFollowers({ followerId: userId }));

      // Call API
      dispatch(followUserThunk(userId));

      // Emit socket
      const socket = getSocket();
      socket?.emit("follow_user", {
        followerId: userState.user._id,
        followedId: userId,
      });
    },

    unfollowUser: async (userId) => {
      // Optimistic UI: update auth user
      const updatedUser = {
        ...userState.user,
        following: (userState.user.following || []).filter((id) => id !== userId),
      };
      dispatch(setUser(updatedUser));

      // Update follow slice
      dispatch(decrementFollowers({ followerId: userId }));

      // Call API
      dispatch(unfollowUserThunk(userId));

      // Emit socket
      const socket = getSocket();
      socket?.emit("unfollow_user", {
        followerId: userState.user._id,
        followedId: userId,
      });
    },

    /* ---------- SOCKET LISTENERS ---------- */
    initFollowSocket: () => {
      const socket = getSocket();
      if (!socket) return;

      socket.on("follow_event", ({ followerId, followedId }) => {
        if (userState.user._id === followedId) {
          dispatch(incrementFollowers({ followerId, followedId }));
        }
      });

      socket.on("unfollow_event", ({ followerId, followedId }) => {
        if (userState.user._id === followedId) {
          dispatch(decrementFollowers({ followerId, followedId }));
        }
      });
    },
  };
};
