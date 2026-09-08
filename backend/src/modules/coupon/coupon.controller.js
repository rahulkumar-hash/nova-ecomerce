import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Coupon } from "./coupon.model.js";

export const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, coupons, "Coupons fetched"));
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    throw new ApiError(400, "Coupon code is required");
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new ApiError(404, "Invalid or expired coupon code");
  }

  const now = new Date();
  if (coupon.expiryDate && now > coupon.expiryDate) {
    throw new ApiError(400, "Coupon code has expired");
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    throw new ApiError(
      400,
      `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === "fixed") {
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discountAmount,
      },
      "Coupon applied successfully"
    )
  );
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndUpdate(id, { $set: req.body }, { new: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  return res.status(200).json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new ApiError(404, "Coupon not found");
  return res.status(200).json(new ApiResponse(200, {}, "Coupon deleted successfully"));
});
