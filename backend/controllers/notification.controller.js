import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate("relatedUser", " name username avatar")
      .populate("relatedPost", "content image").sort({createdAt : - 1});

    res.json(notifications);
  } catch (error) {
    console.log("Error in getNotifications Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notifications = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    res.json(notifications);
  } catch (error) {
    console.log("Error in markNotificationAsRead Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log("Error in deleteNotification Controller", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is available from auth middleware (e.g., JWT)
    
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error('Error fetching unread notifications count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};