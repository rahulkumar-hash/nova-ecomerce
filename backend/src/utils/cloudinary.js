import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Setting } from "../modules/Setting/Setting.model.js";

// Initialize / configure Cloudinary dynamically
export const configureCloudinary = async () => {
  const storeSettings = await Setting.findOne();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || storeSettings?.cloudinary?.cloudName;
  const apiKey = process.env.CLOUDINARY_API_KEY || storeSettings?.cloudinary?.apiKey;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || storeSettings?.cloudinary?.apiSecret;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }
  return false;
};

export const uploadOnCloudinary = async (localFilePath, folder = "novastore") => {
  try {
    if (!localFilePath) return null;

    const isConfigured = await configureCloudinary();
    if (!isConfigured) {
      // Return null to let the server know fallback is required
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folder,
    });

    // Remove local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};
