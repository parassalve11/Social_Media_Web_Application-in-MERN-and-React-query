import React from 'react';
import { Link } from 'react-router-dom';
import Tooltip from './UI/Tooltip';
import { useAuthUser } from '../hooks/useAuthUser';
import FollowButton from './FollowButton';
import AvatarComponent from './UI/AvatarComponent';

export default function UserTooltip({ user, children }) {
  const { data: authUser } = useAuthUser();

  // If user is undefined, render children without tooltip
  if (!user) {
    return <span>{children}</span>;
  }

  const isOwnProfile = authUser?.username === user.username;

  // Format follower/following counts (e.g., 1.2K, 1.5M)
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count;
  };

  const totalFollowers = formatCount(user.followers?.length || 0);
  const totalFollowing = formatCount(user.following?.length || 0);

  const tooltipContent = (
    <div className="w-48 sm:w-56 md:w-60 lg:w-64 p-2 sm:p-3 md:p-4 space-y-2 text-gray-900 bg-white max-w-[80vw] sm:max-w-[80vw] md:max-w-[85vw]">
      {/* Header: Avatar and Follow Button */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <Link
          to={`/profile/${user.username}`}
          className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-opacity"
          aria-label={`View ${user.name}'s profile`}
        >
          <AvatarComponent
            size={40} // Smaller on sm, md
            className="sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
            src={user.avatar}
            alt={`${user.name}'s avatar`}
          />
        </Link>
        {!isOwnProfile && (
          <FollowButton
            userId={user._id}
            className="px-2 py-1 text-xs sm:text-sm font-medium text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        )}
      </div>

      {/* User Info */}
      <div className="space-y-0.5 sm:space-y-1">
        <Link
          to={`/profile/${user.username}`}
          className="block hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`View ${user.name}'s profile`}
        >
          <p className="text-base sm:text-lg font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs sm:text-sm text-gray-500">@{user.username}</p>
        </Link>
      </div>

      {/* Followers/Following */}
      <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
        <Link
          to={`/profile/${user.username}/followers`}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`View ${user.name}'s followers`}
        >
          <span className="font-medium">{totalFollowers}</span> Followers
        </Link>
        <Link
          to={`/profile/${user.username}/following`}
          className="hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`View ${user.name}'s following`}
        >
          <span className="font-medium">{totalFollowing}</span> Following
        </Link>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="text-xs sm:text-sm text-gray-600 line-clamp-2 sm:line-clamp-3 whitespace-pre-line">
          {user.bio}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      delay={0.2} // Reduced for faster response
      minShowTime={0.1}
      className="bg-white border border-gray-200 shadow-lg rounded-lg"
    >
      {children}
    </Tooltip>
  );
}