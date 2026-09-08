import { Router } from "express";
import {
  getProductReviews,
  addReview,
  getAllReviewsAdmin,
  deleteReview,
} from "./review.controller.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

router.get("/product/:productId", getProductReviews);
router.post("/add", verifyToken, addReview);
router.get("/admin/all", adminVerifyJWT, getAllReviewsAdmin);
router.delete("/admin/:id", adminVerifyJWT, deleteReview);

export default router;
