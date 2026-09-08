import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    icon: { type: String, default: "ShoppingBag" },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      set: (v) => (v === "" || v === "null" || !v ? null : v),
    },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre("save", function (next) {
  if (!this.slug || this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export const Category = mongoose.model("Category", categorySchema);
