import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: { type: String, default: null },
  variantTitle: { type: String, default: "" },
  attributes: [
    {
      name: String,
      value: String,
    },
  ],
  name: { type: String, required: true },
  image: { type: String, default: "" },
  price: { type: Number, required: true },
  mrp: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1, default: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
