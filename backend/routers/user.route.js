import { Router } from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getProfile, getSuggestions, updateProfile, getUserByUsername, searchUsers, getAllUsers } from "../controllers/user.controllers.js";



const router  = Router();

router.get('/all',protectRoute,getAllUsers)
router.get('/',protectRoute,getSuggestions);
router.get("/search", protectRoute, searchUsers);
router.get('/:username',protectRoute,getProfile);
router.put('/profile',protectRoute,updateProfile);
router.put('/username/:username',protectRoute,getUserByUsername);

export default router