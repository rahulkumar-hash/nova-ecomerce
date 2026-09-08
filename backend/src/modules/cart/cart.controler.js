import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Cart } from "./cart.modal.js";
import { Product } from "../products/product.modal.js";

export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name slug thumbnail price mrp stock hasVariants variants isPublished",
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  return res.status(200).json(new ApiResponse(200, cart, "Cart fetched"));
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isPublished) {
    throw new ApiError(404, "Product not available");
  }

  let price = product.price;
  let mrp = product.mrp;
  let image = product.thumbnail || (product.images && product.images[0]) || "";
  let variantTitle = "";
  let attributes = [];
  let availableStock = product.stock;

  if (product.hasVariants) {
    if (!variantId) {
      throw new ApiError(400, "Please select a product variant");
    }
    const variant = product.variants.id(variantId);
    if (!variant || !variant.isActive) {
      throw new ApiError(404, "Selected variant not available");
    }
    price = variant.price;
    mrp = variant.mrp || variant.price;
    image = variant.image || image;
    variantTitle = variant.title || "";
    attributes = variant.attributes || [];
    availableStock = variant.stock;
  }

  if (availableStock < quantity) {
    throw new ApiError(400, `Only ${availableStock} items available in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      (variantId ? item.variantId === variantId : !item.variantId)
  );

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + Number(quantity);
    if (newQty > availableStock) {
      throw new ApiError(400, `Cannot add more than ${availableStock} items`);
    }
    cart.items[existingItemIndex].quantity = newQty;
    cart.items[existingItemIndex].price = price;
    cart.items[existingItemIndex].mrp = mrp;
  } else {
    cart.items.push({
      product: productId,
      variantId: variantId || null,
      variantTitle,
      attributes,
      name: product.name,
      image,
      price,
      mrp,
      quantity: Number(quantity),
    });
  }

  await cart.save();
  await cart.populate({
    path: "items.product",
    select: "name slug thumbnail price mrp stock hasVariants variants isPublished",
  });

  return res.status(200).json(new ApiResponse(200, cart, "Item added to cart"));
});

export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  const item = cart.items.id(itemId);
  if (!item) throw new ApiError(404, "Cart item not found");

  const product = await Product.findById(item.product);
  let availableStock = product?.stock || 0;

  if (product?.hasVariants && item.variantId) {
    const variant = product.variants.id(item.variantId);
    if (variant) availableStock = variant.stock;
  }

  if (quantity > availableStock) {
    throw new ApiError(400, `Only ${availableStock} units available`);
  }

  item.quantity = Number(quantity);
  await cart.save();

  await cart.populate({
    path: "items.product",
    select: "name slug thumbnail price mrp stock hasVariants variants isPublished",
  });

  return res.status(200).json(new ApiResponse(200, cart, "Cart item quantity updated"));
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "Cart not found");

  cart.items.pull({ _id: itemId });
  await cart.save();

  await cart.populate({
    path: "items.product",
    select: "name slug thumbnail price mrp stock hasVariants variants isPublished",
  });

  return res.status(200).json(new ApiResponse(200, cart, "Cart item removed"));
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return res.status(200).json(new ApiResponse(200, { items: [] }, "Cart cleared"));
});
