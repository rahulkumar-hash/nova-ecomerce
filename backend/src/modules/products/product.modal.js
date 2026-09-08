import mongoose from "mongoose";
import slugify from "slugify";

const variantAttributeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Color", "Size", "Storage", "RAM"
  value: { type: String, required: true }, // e.g. "Crimson Red", "XL", "256GB", "16GB"
});

const variantSchema = new mongoose.Schema({
  sku: { type: String, trim: true },
  title: { type: String, trim: true }, // e.g. "Red / XL" or "Midnight Black / 256GB"
  attributes: [variantAttributeSchema], // key-value pairs of attributes
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  image: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
});

const specificationSchema = new mongoose.Schema({
  key: { type: String, required: true }, // e.g. "Material", "Battery Capacity", "Dimensions"
  value: { type: String, required: true }, // e.g. "100% Pure Cotton", "5000 mAh", "15 x 8 x 0.8 cm"
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    brand: { type: String, default: "" },
    tags: [{ type: String }],

    images: [{ type: String }],
    thumbnail: { type: String, default: "" },

    hasVariants: { type: Boolean, default: false },

    // Simple Product Fields (used when hasVariants is false)
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: "" },

    // Defined Attribute Types (e.g. [{ name: "Color", values: ["Black", "Blue"] }, { name: "Size", values: ["M", "L"] }])
    attributeOptions: [
      {
        name: String,
        values: [String],
      },
    ],

    // Variant Combinations
    variants: [variantSchema],

    // Key Specifications
    specifications: [specificationSchema],

    // SEO
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: [{ type: String }],

    // Flags
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },

    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + "-" + Date.now().toString().slice(-4);
  }

  // Ensure thumbnail exists
  if (!this.thumbnail && this.images && this.images.length > 0) {
    this.thumbnail = this.images[0];
  }

  // Calculate pricing for simple products
  if (!this.hasVariants) {
    this.mrp = Number(this.mrp) || 0;
    this.discountValue = Number(this.discountValue) || 0;

    let finalPrice = this.mrp;
    if (this.mrp > 0 && this.discountValue > 0) {
      if (this.discountType === "percentage") {
        this.discount = this.discountValue;
        finalPrice = Math.round(this.mrp - (this.mrp * this.discountValue) / 100);
      } else if (this.discountType === "fixed") {
        finalPrice = Math.max(0, this.mrp - this.discountValue);
        this.discount = Math.round((this.discountValue / this.mrp) * 100);
      }
    } else {
      this.discount = 0;
    }
    this.price = finalPrice;
  } else if (this.hasVariants && this.variants.length > 0) {
    // For variant products, compute min price and total stock
    let minPrice = Infinity;
    let minMrp = 0;
    let totalStock = 0;

    this.variants.forEach((v) => {
      v.mrp = Number(v.mrp) || Number(v.price) || 0;
      v.price = Number(v.price) || v.mrp;
      if (v.mrp > v.price) {
        v.discount = Math.round(((v.mrp - v.price) / v.mrp) * 100);
      } else {
        v.discount = 0;
      }

      if (v.price < minPrice) {
        minPrice = v.price;
        minMrp = v.mrp;
      }
      totalStock += Number(v.stock) || 0;
    });

    this.price = minPrice === Infinity ? 0 : minPrice;
    this.mrp = minMrp;
    this.stock = totalStock;
    if (this.mrp > this.price) {
      this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
    } else {
      this.discount = 0;
    }
  }

  next();
});

export const Product = mongoose.model("Product", productSchema);
