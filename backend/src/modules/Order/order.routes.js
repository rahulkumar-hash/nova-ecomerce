import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderByIdOrNumber,
  downloadOrderInvoicePDF,
  cancelOrder,
  createRazorpayOrder,
  verifyPayment,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  requestOrderReturn,
  adminUpdateReturnStatus,
  adminExportOrdersCsv,
  adminGetReportsSummary,
} from "./order.controller.js";
import { verifyToken, verifyTokenOrAdmin } from "../../middlewares/verifyToken.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Customer Endpoints
router.post("/create", verifyToken, createOrder);
router.post("/razorpay/create-order", verifyToken, createRazorpayOrder);
router.post("/verify-payment", verifyToken, verifyPayment);
router.get("/my-orders", verifyToken, getMyOrders);
router.get("/:identifier/download-invoice", verifyTokenOrAdmin, downloadOrderInvoicePDF);
router.get("/:identifier", verifyTokenOrAdmin, getOrderByIdOrNumber);
router.post("/:id/cancel", verifyToken, cancelOrder);
router.post("/:id/return", verifyToken, requestOrderReturn);

// Admin Endpoints
router.get("/admin/export-csv", adminVerifyJWT, adminExportOrdersCsv);
router.get("/admin/export/csv", adminVerifyJWT, adminExportOrdersCsv);
router.get("/admin/reports/summary", adminVerifyJWT, adminGetReportsSummary);
router.get("/admin/all", adminVerifyJWT, getAllOrdersAdmin);
router.patch("/admin/:id/status", adminVerifyJWT, updateOrderStatusAdmin);
router.put("/admin/:id/status", adminVerifyJWT, updateOrderStatusAdmin);
router.patch("/:id/status", adminVerifyJWT, updateOrderStatusAdmin);
router.put("/:id/status", adminVerifyJWT, updateOrderStatusAdmin);
router.put("/admin/:id/return-status", adminVerifyJWT, adminUpdateReturnStatus);
router.put("/:id/return-status", adminVerifyJWT, adminUpdateReturnStatus);

export default router;
