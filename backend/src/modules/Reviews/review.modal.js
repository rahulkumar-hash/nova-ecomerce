import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
