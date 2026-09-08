import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../modules/admin/admin.modal.js";

export const adminVerifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.adminToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized Admin access: Token missing");
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );

    const admin = await Admin.findById(decodedToken?._id).select("-password");

    if (!admin) {
      throw new ApiError(401, "Invalid Admin Token: Admin not found");
    }

    if (!admin.isActive) {
      throw new ApiError(403, "Admin account disabled");
    }

    req.admin = admin;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired admin token");
  }
});
