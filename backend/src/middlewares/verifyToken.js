import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../modules/auth/user.modal.js";
import { Admin } from "../modules/admin/admin.modal.js";

export const verifyToken = asyncHandler(async (req, res, next) => {
  let token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "") ||
    req.query?.token;

  if (typeof token === "string") {
    token = token.trim();
    if (token === "null" || token === "undefined" || token === "") {
      token = null;
    }
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    if (user.status === "inactive") {
      throw new ApiError(403, "Your account has been deactivated");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }
});

export const optionalVerifyToken = asyncHandler(async (req, res, next) => {
  let token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "") ||
    req.query?.token;

  if (typeof token === "string") {
    token = token.trim();
    if (token === "null" || token === "undefined" || token === "") {
      token = null;
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );
    const user = await User.findById(decodedToken?._id).select("-password");
    if (user && user.status !== "inactive") {
      req.user = user;
    }
  } catch (error) {
    // Ignore error for optional authentication
  }
  next();
});

export const verifyTokenOrAdmin = asyncHandler(async (req, res, next) => {
  let token =
    req.cookies?.accessToken ||
    req.cookies?.adminToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "") ||
    req.query?.token;

  if (typeof token === "string") {
    token = token.trim();
    if (token === "null" || token === "undefined" || token === "") {
      token = null;
    }
  }

  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET
    );

    // Check if token belongs to Customer User
    const user = await User.findById(decodedToken?._id).select("-password");
    if (user && user.status !== "inactive") {
      req.user = user;
      return next();
    }

    // Check if token belongs to Admin
    const admin = await Admin.findById(decodedToken?._id).select("-password");
    if (admin && admin.isActive) {
      req.admin = admin;
      return next();
    }

    throw new ApiError(401, "Invalid access token: Account not found or inactive");
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }
});

