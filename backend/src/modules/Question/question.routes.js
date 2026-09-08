import { Router } from "express";
import {
  getProductQuestions,
  askQuestion,
  adminAnswerQuestion,
  adminGetAllQuestions,
  adminDeleteQuestion,
} from "./question.controller.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Public & Customer
router.get("/product/:productId", getProductQuestions);
router.post("/ask", verifyToken, askQuestion);

// Admin
router.get("/admin/all", adminVerifyJWT, adminGetAllQuestions);
router.put("/admin/:id/answer", adminVerifyJWT, adminAnswerQuestion);
router.delete("/admin/:id", adminVerifyJWT, adminDeleteQuestion);

export default router;
