import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Setting } from "./Setting.model.js";

export const getStoreSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return res.status(200).json(new ApiResponse(200, settings, "Store settings fetched"));
});

// Helper function to recursively deep merge objects
const deepMerge = (target, source) => {
  if (!source || typeof source !== "object") return target;
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
};

export const updateStoreSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create(req.body);
  } else {
    const existingData = settings.toObject();
    const mergedData = deepMerge(existingData, req.body);
    
    settings.set(mergedData);
    await settings.save();
  }
  return res.status(200).json(new ApiResponse(200, settings, "Store settings updated successfully"));
});
