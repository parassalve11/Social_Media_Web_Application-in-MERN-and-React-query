import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { deleteNotification, getNotifications, getUnreadNotificationsCount, markNotificationAsRead } from "../controllers/notification.controller.js";




const router = Router();


router.get('/',protectRoute,getNotifications);
router.put('/:id/read',protectRoute,markNotificationAsRead);
router.delete('/:id',protectRoute,deleteNotification);
router.get('/unread-count', protectRoute, getUnreadNotificationsCount);


export default router;