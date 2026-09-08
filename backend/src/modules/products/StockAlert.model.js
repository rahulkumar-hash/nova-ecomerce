import mongoose from "mongoose";

const stockAlertSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    notified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

stockAlertSchema.index({ product: 1, email: 1, variantId: 1 }, { unique: true });

export const StockAlert = mongoose.model("StockAlert", stockAlertSchema);
