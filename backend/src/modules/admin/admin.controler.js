import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Admin } from "./admin.modal.js";
import { sendOtpEmail } from "../../utils/mailer.js";
import bcrypt from "bcryptjs";
import { User } from "../auth/user.modal.js";
import { Product } from "../products/product.modal.js";
import { Order } from "../Order/order.model.js";

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    throw new ApiError(404, "Invalid admin credentials");
  }

  if (!admin.isActive) {
    throw new ApiError(403, "Admin account is deactivated");
  }

  const isPasswordValid = await admin.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  const adminToken = admin.generateAccessToken();
  const loggedInAdmin = await Admin.findById(admin._id).select("-password");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("adminToken", adminToken, options)
    .json(
      new ApiResponse(
        200,
        { admin: loggedInAdmin, token: adminToken },
        "Admin logged in successfully"
      )
    );
});

export const getAdminProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.admin, "Admin profile fetched"));
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, email, avatar } = req.body;
  const adminId = req.admin._id;

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  if (email && email.toLowerCase() !== admin.email) {
    const existing = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: adminId } });
    if (existing) {
      throw new ApiError(400, "Email address is already in use by another account");
    }
    admin.email = email.toLowerCase();
  }

  if (name) admin.name = name.trim();
  if (avatar !== undefined) admin.avatar = avatar;

  await admin.save();
  const updatedAdmin = await Admin.findById(adminId).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAdmin, "Admin profile updated successfully"));
});

export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin._id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  const isCurrentPasswordCorrect = await admin.isPasswordCorrect(currentPassword);
  if (!isCurrentPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  admin.password = newPassword;
  await admin.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalCustomers, orders] = await Promise.all([
    Product.countDocuments({ isPublished: true }),
    User.countDocuments({ role: "customer" }),
    Order.find().sort({ createdAt: -1 }),
  ]);

  let totalRevenue = 0;
  let deliveredOrders = 0;
  let pendingOrders = 0;
  let processingOrders = 0;
  let shippedOrders = 0;
  let cancelledOrders = 0;

  const monthlyMap = {};
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    monthlyMap[key] = { month: key, revenue: 0, orders: 0 };
  }

  orders.forEach((order) => {
    if (order.orderStatus !== "Cancelled") {
      totalRevenue += order.totalAmount || 0;
    }

    if (order.orderStatus === "Delivered") deliveredOrders++;
    else if (order.orderStatus === "Pending") pendingOrders++;
    else if (order.orderStatus === "Processing") processingOrders++;
    else if (order.orderStatus === "Shipped" || order.orderStatus === "Out for Delivery") shippedOrders++;
    else if (order.orderStatus === "Cancelled") cancelledOrders++;

    const orderDate = new Date(order.createdAt);
    const mKey = `${months[orderDate.getMonth()]} ${orderDate.getFullYear()}`;
    if (monthlyMap[mKey]) {
      if (order.orderStatus !== "Cancelled") {
        monthlyMap[mKey].revenue += order.totalAmount || 0;
      }
      monthlyMap[mKey].orders += 1;
    }
  });

  const chartData = Object.values(monthlyMap);
  const recentOrders = orders.slice(0, 8);

  // Low stock products
  const lowStockProducts = await Product.find({
    $or: [
      { hasVariants: false, stock: { $lte: 5 } },
      { hasVariants: true, "variants.stock": { $lte: 5 } },
    ],
  })
    .limit(6)
    .select("name thumbnail stock variants hasVariants price");

  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        avgOrderValue,
        orderStats: {
          pending: pendingOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        chartData,
        recentOrders,
        lowStockProducts,
      },
      "Dashboard statistics fetched successfully"
    )
  );
});

export const getAllCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  const query = { role: "customer" };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const customers = await User.find(query)
    .select("-password -refreshToken")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        customers,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
      "Customers list fetched successfully"
    )
  );
});

export const toggleCustomerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "Customer not found");

  user.status = user.status === "active" ? "blocked" : "active";
  await user.save();

  return res.status(200).json(new ApiResponse(200, user, "Customer status updated"));
});

// -- Admin Forgot Password ---------------------------------------------------

export const adminForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    return res.status(200).json(new ApiResponse(200, {}, "If this email is registered, an OTP has been sent."));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 8);

  admin.resetOtp = hashedOtp;
  admin.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await admin.save({ validateBeforeSave: false });

  try {
    await sendOtpEmail(admin.email, otp, admin.name, "admin");
  } catch (err) {
    admin.resetOtp = null;
    admin.resetOtpExpiry = null;
    await admin.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send OTP email. Please verify SMTP settings in Store Settings.");
  }

  return res.status(200).json(new ApiResponse(200, {}, "OTP sent to your admin email address."));
});

export const adminResetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) throw new ApiError(400, "Email, OTP and new password are required");
  if (newPassword.length < 6) throw new ApiError(400, "Password must be at least 6 characters");

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin || !admin.resetOtp || !admin.resetOtpExpiry) {
    throw new ApiError(400, "Invalid or expired OTP. Please request a new one.");
  }

  if (admin.resetOtpExpiry < new Date()) {
    admin.resetOtp = null;
    admin.resetOtpExpiry = null;
    await admin.save({ validateBeforeSave: false });
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  const isOtpValid = await bcrypt.compare(otp, admin.resetOtp);
  if (!isOtpValid) throw new ApiError(400, "Invalid OTP. Please try again.");

  admin.password = newPassword;
  admin.resetOtp = null;
  admin.resetOtpExpiry = null;
  await admin.save();

  return res.status(200).json(new ApiResponse(200, {}, "Admin password reset successfully. Please login with your new password."));
});

export const testSmtpConnection = asyncHandler(async (req, res) => {
  const { testEmail } = req.body;
  const targetEmail = testEmail || req.admin?.email;
  if (!targetEmail) throw new ApiError(400, "Target email address is required to send test email");

  try {
    const { sendTestEmail } = await import("../../utils/mailer.js");
    await sendTestEmail(targetEmail);
    return res.status(200).json(new ApiResponse(200, {}, `Test email sent successfully to ${targetEmail}`));
  } catch (err) {
    throw new ApiError(500, `SMTP Test Failed: ${err.message}`);
  }
});
