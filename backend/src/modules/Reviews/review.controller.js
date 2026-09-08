import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Review } from "./review.modal.js";
import { Product } from "../products/product.modal.js";

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let filterProduct = productId;

  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    const prod = await Product.findOne({ slug: productId });
    if (prod) {
      filterProduct = prod._id;
    }
  }

  const reviews = await Review.find({ product: filterProduct, isApproved: true }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, reviews, "Product reviews fetched"));
});

export const addReview = asyncHandler(async (req, res) => {
  const { productId, rating, title = "", comment } = req.body;

  if (!productId || !rating || !comment) {
    throw new ApiError(400, "Product, rating and comment are required");
  }

  let targetProductId = productId;
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    const prod = await Product.findOne({ slug: productId });
    if (!prod) throw new ApiError(404, "Product not found");
    targetProductId = prod._id;
  }

  // Create review
  const review = await Review.create({
    product: targetProductId,
    user: req.user._id,
    userName: req.user.name || "Verified Customer",
    userAvatar: req.user.avatar || "",
    rating: Math.min(5, Math.max(1, Number(rating))),
    title: title.trim(),
    comment: comment.trim(),
    verifiedPurchase: true,
    isApproved: true,
  });

  // Recalculate average rating for product
  const reviews = await Review.find({ product: targetProductId, isApproved: true });
  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : Number(rating);

  await Product.findByIdAndUpdate(targetProductId, {
    rating: Number(avgRating.toFixed(1)),
    reviewsCount: reviews.length,
  });

  return res.status(201).json(new ApiResponse(201, review, "Review added successfully"));
});

export const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("product", "name slug thumbnail")
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, reviews, "All reviews fetched"));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new ApiError(404, "Review not found");

  // Recalculate product rating
  const reviews = await Review.find({ product: review.product, isApproved: true });
  const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  await Product.findByIdAndUpdate(review.product, {
    rating: Number(avgRating.toFixed(1)),
    reviewsCount: reviews.length,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Review deleted successfully"));
});
