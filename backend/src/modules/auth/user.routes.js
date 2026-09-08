import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  resetPassword,
} from "./user.controler.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.post("/logout", verifyToken, logoutUser);
router.get("/me", verifyToken, getCurrentUser);
router.put("/profile", verifyToken, updateProfile);

router.post("/address", verifyToken, addAddress);
router.put("/address/:addressId", verifyToken, updateAddress);
router.delete("/address/:addressId", verifyToken, deleteAddress);

export default router;

