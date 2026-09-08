import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "./user.modal.js";
import { sendOtpEmail } from "../../utils/mailer.js";
import bcrypt from "bcryptjs";

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || "",
  });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        { user: createdUser, accessToken, refreshToken },
        "User registered successfully"
      )
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "Invalid email or password");
  }

  if (user.status === "inactive" || user.status === "blocked") {
    throw new ApiError(403, "Your account is disabled. Please contact support.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, email } = req.body;
  const userId = req.user._id;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name.trim();
  if (phone !== undefined) updateFields.phone = phone.trim();
  if (avatar !== undefined) updateFields.avatar = avatar;

  if (email && email.toLowerCase() !== req.user.email) {
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
    if (existing) {
      throw new ApiError(400, "Email address is already in use by another account");
    }
    updateFields.email = email.toLowerCase().trim();
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true }
  ).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});

export const addAddress = asyncHandler(async (req, res) => {
  const { name, phone, street, landmark, city, state, pincode, country, addressType, isDefault } = req.body;

  if (!name || !phone || !street || !city || !state || !pincode) {
    throw new ApiError(400, "All address fields are required");
  }

  const user = await User.findById(req.user._id);

  if (isDefault || user.addresses.length === 0) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push({
    name,
    phone,
    street,
    landmark: landmark || "",
    city,
    state,
    pincode,
    country: country || "India",
    addressType: addressType || "home",
    isDefault: isDefault || user.addresses.length === 0,
  });

  await user.save();
  return res.status(200).json(new ApiResponse(200, user.addresses, "Address added successfully"));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const updateData = req.body;

  const user = await User.findById(req.user._id);
  const address = user.addresses.id(addressId);

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (updateData.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, updateData);
  await user.save();

  return res.status(200).json(new ApiResponse(200, user.addresses, "Address updated successfully"));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user._id);
  user.addresses.pull({ _id: addressId });

  if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return res.status(200).json(new ApiResponse(200, user.addresses, "Address deleted successfully"));
});

// -- Forgot Password ----------------------------------------------------------

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(200).json(new ApiResponse(200, {}, "If this email is registered, an OTP has been sent."));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 8);

  user.resetOtp = hashedOtp;
  user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(user.email, otp, user.name, "customer");
  } catch (err) {
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send OTP email. Please check SMTP settings in admin panel.");
  }

  return res.status(200).json(new ApiResponse(200, {}, "OTP sent to your email address."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) throw new ApiError(400, "Email, OTP and new password are required");
  if (newPassword.length < 6) throw new ApiError(400, "Password must be at least 6 characters");

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.resetOtp || !user.resetOtpExpiry) {
    throw new ApiError(400, "Invalid or expired OTP. Please request a new one.");
  }

  if (user.resetOtpExpiry < new Date()) {
    user.resetOtp = null; user.resetOtpExpiry = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
  if (!isOtpValid) throw new ApiError(400, "Invalid OTP. Please try again.");

  user.password = newPassword;
  user.resetOtp = null;
  user.resetOtpExpiry = null;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully. Please login with your new password."));
});
