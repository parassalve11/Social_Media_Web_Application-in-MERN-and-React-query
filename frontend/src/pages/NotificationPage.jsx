import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, UserPlus, Eye, Trash2, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axiosInstance from "../lib/axiosIntance"
import Loader from '../components/UI/Loader';


// Notification rendering utilities
const renderNotificationIcon = (type) => {
  const iconClass = 'w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 hover:scale-110';

  switch (type) {
    case 'like':
      return <ThumbsUp className={`${iconClass} text-blue-600`} aria-label="Like icon" />;
    case 'comment':
      return <MessageSquare className={`${iconClass} text-green-600`} aria-label="Comment icon" />;
    case 'follow':
      return <UserPlus className={`${iconClass} text-purple-600`} aria-label="Connection accepted icon" />;
    default:
      return null;
  }
};

const renderNotificationContent = (notification) => {
  const linkClass = 'font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200';
  const textClass = 'text-gray-600 text-xs sm:text-sm';

  switch (notification.type) {
    case 'like':
      return (
        <span className={textClass}>
          <strong className={linkClass}>{notification.relatedUser.name}</strong> liked your post
        </span>
      );
    case 'comment':
      return (
        <span className={textClass}>
          <Link
            to={`/profile/${notification.relatedUser.username}`}
            className={linkClass}
            aria-label={`View ${notification.relatedUser.name}'s profile`}
          >
            {notification.relatedUser.name}
          </Link>{' '}
          commented on your post
        </span>
      );
    case 'follow':
      return (
        <span className={textClass}>
          <Link
            to={`/profile/${notification.relatedUser.username}`}
            className={linkClass}
            aria-label={`View ${notification.relatedUser.name}'s profile`}
          >
            {notification.relatedUser.name}
          </Link>{' '}
          accepted your connection request
        </span>
      );
    default:
      return null;
  }
};



const renderRelatedPost = (relatedPost) => {
  if (!relatedPost) return null;

  return (
    <Link
      to={`/posts/${relatedPost._id}`}
      className="mt-2 p-1.5 sm:p-2 bg-gray-50 rounded-md flex max-w-[10rem]  items-center tracking-tighter break-all  space-x-2 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`View post: ${relatedPost.content?.substring(0, 50) || 'Post'}`}
    >
      {relatedPost.image ? (
        <img
          src={relatedPost.image}
          alt="Post preview"
          className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded border border-gray-200"
          onError={(e) => (e.target.src = '/fallback-image.jpg')}
        />
      ) : (
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-gray-600 truncate">{relatedPost.content || 'No content available'}</p>
      </div>
    </Link>
  );
};

export default function NotificationPage() {
  const queryClient = useQueryClient();

 
  
  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axiosInstance.get('/notifications');
      return response.data; 
    },
  });

  const { mutate: markNotificationAsReadMutation } = useMutation({
    mutationFn: async (notificationId) => await axiosInstance.put(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'],})
    },
  });

  
  const { mutate: deleteNotificationMutation } = useMutation({
    mutationFn: async (notificationId) => await axiosInstance.delete(`/notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
       queryClient.invalidateQueries({ queryKey: ['unreadNotifications'],})
    },
  });

//  const totalNotifications = notifications.data.read == false

  return (
    <div className="grid grid-cols-1 gap-4 p-2 sm:p-4 max-w-4xl mx-auto overflow-auto">
      

  
      <div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Notifications </h1>

          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading notifications...</span>
            </div>
          ) : error ? (
            <p className="text-red-600 text-center py-4 text-sm sm:text-base">Failed to load notifications. Please try again.</p>
          ) : notifications && notifications.length > 0 ? (
            <ul className="space-y-3 sm:space-y-4">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`border rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${
                    !notification.read ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      {/* Profile Picture */}
                      <Link to={`/profile/${notification.relatedUser.username}`} aria-label={`View ${notification.relatedUser.name}'s profile`}>
                        <img
                          src={notification.relatedUser.profilePicture || '/avatar.png'}
                          alt={`${notification.relatedUser.name}'s profile picture`}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-200"
                        />
                      </Link>

                      {/* Notification Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-gray-100 rounded-full">
                            {renderNotificationIcon(notification.type)}
                          </div>
                          <p className="text-sm">{renderNotificationContent(notification)}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {renderRelatedPost(notification.relatedPost)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 sm:gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsReadMutation(notification._id)}
                          className="p-1 sm:p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-blue-500"
                          aria-label="Mark notification as read"
                          title="Mark as read"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotificationMutation(notification._id)}
                        className="p-1 sm:p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-red-500"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <BellOff className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No notifications at the moment.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}