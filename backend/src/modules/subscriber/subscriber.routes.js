import { Router } from "express";
import {
  subscribeNewsletter,
  getAllSubscribers,
  deleteSubscriber,
  exportSubscribers,
} from "./subscriber.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Public subscription endpoint
router.post("/subscribe", subscribeNewsletter);

// Protected Admin management endpoints
router.get("/", adminVerifyJWT, getAllSubscribers);
router.get("/export", adminVerifyJWT, exportSubscribers);
router.delete("/:id", adminVerifyJWT, deleteSubscriber);

export default router;
