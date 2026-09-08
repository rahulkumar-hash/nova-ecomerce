import { Router } from "express";
import authRoutes from "../modules/auth/user.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import productRoutes from "../modules/products/product.routes.js";
import categoryRoutes from "../modules/category/category.routes.js";
import bannerRoutes from "../modules/Banner/banner.routes.js";
import couponRoutes from "../modules/coupon/coupon.routes.js";
import cartRoutes from "../modules/cart/cart.routes.js";
import wishlistRoutes from "../modules/wishlist/wishlist.routes.js";
import orderRoutes from "../modules/Order/order.routes.js";
import settingRoutes from "../modules/Setting/settings.routes.js";
import reviewRoutes from "../modules/Reviews/review.routes.js";
import pageRoutes from "../modules/pages/page.routes.js";
import shippingRoutes from "../modules/shipping/shipping.routes.js";
import subscriberRoutes from "../modules/subscriber/subscriber.routes.js";
import questionRoutes from "../modules/Question/question.routes.js";
import aiRoutes from "../modules/ai/ai.routes.js";
import { upload } from "../middlewares/multer.js";
import { adminVerifyJWT } from "../middlewares/adminVerifyJWT.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/admin/ai", aiRoutes);
router.use("/ai", aiRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/banners", bannerRoutes);
router.use("/coupons", couponRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/settings", settingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/pages", pageRoutes);
router.use("/shipping", shippingRoutes);
router.use("/subscribers", subscriberRoutes);
router.use("/questions", questionRoutes);

// Unified Upload route for products, categories, banners (Supports Cloudinary & Local Fallback)
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded" });
  }

  try {
    const localFilePath = req.file.path;
    const cloudinaryUrl = await uploadOnCloudinary(localFilePath, "novastore_uploads");

    if (cloudinaryUrl) {
      return res.status(200).json(new ApiResponse(200, { url: cloudinaryUrl, provider: "cloudinary" }, "Image uploaded to Cloudinary successfully"));
    }

    // Local fallback
    const localUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json(new ApiResponse(200, { url: localUrl, provider: "local" }, "Image uploaded locally successfully"));
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Image upload failed" });
  }
});

export default router;
