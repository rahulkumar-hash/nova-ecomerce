import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Category } from "./category.modal.js";
import { Product } from "../products/product.modal.js";
import slugify from "slugify";

export const getAllCategories = asyncHandler(async (req, res) => {
  const { includeInactive = "false", featuredOnly = "false" } = req.query;
  const filter = includeInactive === "true" ? {} : { isActive: true };
  if (featuredOnly === "true") {
    filter.isFeatured = true;
  }

  const categories = await Category.find(filter)
    .populate("parentCategory", "name slug")
    .sort({ displayOrder: 1, name: 1 });

  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug }).populate("parentCategory", "name slug");

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const subcategories = await Category.find({ parentCategory: category._id, isActive: true });
  const productsCount = await Product.countDocuments({ category: category._id, isPublished: true });

  return res.status(200).json(
    new ApiResponse(
      200,
      { category, subcategories, productsCount },
      "Category details fetched"
    )
  );
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, icon, parentCategory, isFeatured, isActive, displayOrder } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const category = await Category.create({
    name,
    description: description || "",
    image: image || "",
    icon: icon || "ShoppingBag",
    parentCategory: parentCategory || null,
    isFeatured: isFeatured !== undefined ? isFeatured : false,
    isActive: isActive !== undefined ? isActive : true,
    displayOrder: Number(displayOrder) || 0,
  });

  return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Sanitize empty string or invalid parentCategory to null
  if (
    updateData.parentCategory === "" ||
    updateData.parentCategory === "null" ||
    updateData.parentCategory === "undefined" ||
    !updateData.parentCategory
  ) {
    updateData.parentCategory = null;
  }

  if (updateData.name) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if any product is using this category
  const productsCount = await Product.countDocuments({ category: id });
  if (productsCount > 0) {
    throw new ApiError(400, `Cannot delete category: ${productsCount} products are linked to it`);
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully"));
});
