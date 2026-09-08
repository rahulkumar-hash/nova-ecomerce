import { Router } from "express";
import {
  checkCourierRates,
  assignCourierAndShip,
  testDeliveryConnection,
} from "./shipping.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Admin-only shipping operations
router.post("/check-rates/:orderId", adminVerifyJWT, checkCourierRates);
router.post("/assign-courier/:orderId", adminVerifyJWT, assignCourierAndShip);
router.post("/test-connection", adminVerifyJWT, testDeliveryConnection);

export default router;
