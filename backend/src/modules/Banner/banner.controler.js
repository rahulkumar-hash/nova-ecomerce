import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Banner } from "./banner.modal.js";

export const getAllBanners = asyncHandler(async (req, res) => {
  const { type, activeOnly = "true" } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (activeOnly === "true") filter.isActive = true;

  const banners = await Banner.find(filter).sort({ position: 1, createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, banners, "Banners fetched"));
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  return res.status(201).json(new ApiResponse(201, banner, "Banner created successfully"));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndUpdate(id, { $set: req.body }, { new: true });
  if (!banner) throw new ApiError(404, "Banner not found");
  return res.status(200).json(new ApiResponse(200, banner, "Banner updated successfully"));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) throw new ApiError(404, "Banner not found");
  return res.status(200).json(new ApiResponse(200, {}, "Banner deleted successfully"));
});
