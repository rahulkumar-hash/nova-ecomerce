import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Product } from "./product.modal.js";
import { Category } from "../category/category.modal.js";
import { StockAlert } from "./StockAlert.model.js";
import { sendBackInStockEmail } from "../../utils/mailer.js";

export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    subCategory,
    brand,
    minPrice,
    maxPrice,
    search,
    sort = "newest",
    isFeatured,
    isTrending,
    isBestSeller,
    isNewArrival,
    inStockOnly,
    publishedOnly = "true",
  } = req.query;

  const filter = {};

  if (publishedOnly === "true") {
    filter.isPublished = true;
  }

  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }
  }

  if (subCategory) {
    if (subCategory.match(/^[0-9a-fA-F]{24}$/)) {
      filter.subCategory = subCategory;
    } else {
      const subCat = await Category.findOne({ slug: subCategory });
      if (subCat) filter.subCategory = subCat._id;
    }
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: "i" };
  }

  if (isFeatured === "true") filter.isFeatured = true;
  if (isTrending === "true") filter.isTrending = true;
  if (isBestSeller === "true") filter.isBestSeller = true;
  if (isNewArrival === "true") filter.isNewArrival = true;

  if (inStockOnly === "true") {
    filter.stock = { $gt: 0 };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === "price-low") sortOption = { price: 1 };
  else if (sort === "price-high") sortOption = { price: -1 };
  else if (sort === "popular") sortOption = { salesCount: -1, rating: -1 };
  else if (sort === "rating") sortOption = { rating: -1 };
  else if (sort === "newest") sortOption = { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
      "Products fetched successfully"
    )
  );
});

export const getProductBySlugOrId = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  let query = { slug: identifier };
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: identifier }, { slug: identifier }] };
  }

  const product = await Product.findOne(query)
    .populate("category", "name slug icon")
    .populate("subCategory", "name slug");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Related products from same category
  const relatedProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id },
    isPublished: true,
  })
    .limit(4)
    .select("name slug price mrp discount thumbnail rating reviewsCount hasVariants");

  return res.status(200).json(
    new ApiResponse(
      200,
      { product, relatedProducts },
      "Product details fetched successfully"
    )
  );
});

export const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  if (!productData.name || !productData.category) {
    throw new ApiError(400, "Product name and category are required");
  }

  const product = new Product(productData);
  await product.save();

  const savedProduct = await Product.findById(product._id)
    .populate("category", "name slug")
    .populate("subCategory", "name slug");

  return res.status(201).json(new ApiResponse(201, savedProduct, "Product created successfully"));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const previousStock = product.stock;
  Object.assign(product, updateData);
  await product.save();

  // Auto-trigger restock alerts if stock was 0 and now > 0
  if (previousStock <= 0 && product.stock > 0) {
    try {
      const pendingAlerts = await StockAlert.find({ product: product._id, notified: false });
      if (pendingAlerts.length > 0) {
        for (const alert of pendingAlerts) {
          await sendBackInStockEmail(product.name, product.slug, alert.email);
          alert.notified = true;
          alert.notifiedAt = new Date();
          await alert.save();
        }
      }
    } catch (err) {
      console.warn("Error firing back-in-stock alert emails:", err.message);
    }
  }

  const updatedProduct = await Product.findById(product._id)
    .populate("category", "name slug")
    .populate("subCategory", "name slug");

  return res.status(200).json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct("brand", { isPublished: true, brand: { $ne: "" } });
  return res.status(200).json(new ApiResponse(200, brands, "Brands fetched"));
});

export const subscribeStockAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, variantId = "" } = req.body;

  if (!email || !email.includes("@")) {
    throw new ApiError(400, "A valid email address is required");
  }

  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");

  const alert = await StockAlert.findOneAndUpdate(
    { product: id, email: email.toLowerCase().trim(), variantId },
    { product: id, email: email.toLowerCase().trim(), variantId, notified: false },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      alert,
      `🔔 Success! We will email you at ${email} as soon as ${product.name} is back in stock.`
    )
  );
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 5 } = req.query;
  const products = await Product.find({ stock: { $lte: Number(threshold) } })
    .select("name slug price thumbnail stock isPublished")
    .sort({ stock: 1 });

  return res.status(200).json(
    new ApiResponse(200, products, "Low stock products fetched")
  );
});
