import { Router } from "express";
import {
  getAllCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "./coupon.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

router.get("/", getAllCoupons);
router.get("/public", getAllCoupons);
router.post("/validate", validateCoupon);
router.post("/", adminVerifyJWT, createCoupon);
router.put("/:id", adminVerifyJWT, updateCoupon);
router.delete("/:id", adminVerifyJWT, deleteCoupon);

export default router;
