import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Wishlist } from "./wishlist.modal.js";

export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    match: { isPublished: true },
    select: "name slug thumbnail price mrp discount rating reviewsCount stock hasVariants",
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  return res.status(200).json(new ApiResponse(200, wishlist, "Wishlist fetched"));
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  const exists = wishlist.products.includes(productId);
  if (exists) {
    wishlist.products.pull(productId);
  } else {
    wishlist.products.push(productId);
  }

  await wishlist.save();
  await wishlist.populate({
    path: "products",
    select: "name slug thumbnail price mrp discount rating reviewsCount stock hasVariants",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { wishlist, isAdded: !exists },
      exists ? "Removed from wishlist" : "Added to wishlist"
    )
  );
});
