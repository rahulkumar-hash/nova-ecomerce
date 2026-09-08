import { Router } from "express";
import {
  adminLogin,
  adminForgotPassword,
  adminResetPassword,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getDashboardStats,
  getAllCustomers,
  toggleCustomerStatus,
  testSmtpConnection,
} from "./admin.controler.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Public routes
router.post("/login", adminLogin);
router.post("/forgot-password", adminForgotPassword);
router.post("/reset-password", adminResetPassword);

// Protected routes
router.get("/me", adminVerifyJWT, getAdminProfile);
router.put("/profile", adminVerifyJWT, updateAdminProfile);
router.put("/change-password", adminVerifyJWT, changeAdminPassword);
router.get("/dashboard-stats", adminVerifyJWT, getDashboardStats);
router.get("/customers", adminVerifyJWT, getAllCustomers);
router.patch("/customers/:id/toggle-status", adminVerifyJWT, toggleCustomerStatus);
router.post("/test-smtp", adminVerifyJWT, testSmtpConnection);

export default router;
