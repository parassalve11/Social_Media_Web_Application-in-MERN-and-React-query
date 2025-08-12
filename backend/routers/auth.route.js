import { Router } from "express";
import {
  emailExist,
  getCurrentUser,
  googleAuth,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyUser,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/forget-password/check" , emailExist);
router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/google-auth", googleAuth);
router.post("/signout", signOut);
router.post("/forget-password/:email" , verifyUser);
router.post("/forget-password/:email/reset" , resetPassword);

router.get("/me", protectRoute, getCurrentUser);

export default router;
