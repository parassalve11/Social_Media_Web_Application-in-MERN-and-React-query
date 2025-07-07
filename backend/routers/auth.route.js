import { Router } from "express";
import {
  getCurrentUser,
  googleAuth,
  signIn,
  signOut,
  signUp,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/google-auth", googleAuth);
router.post("/signout", signOut);

router.get("/me", protectRoute, getCurrentUser);

export default router;
