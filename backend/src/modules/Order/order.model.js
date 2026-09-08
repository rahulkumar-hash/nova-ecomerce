import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
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
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
});

const trackingHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: "" },
  location: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    invoiceNumber: { type: String, unique: true, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [orderItemSchema],
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      landmark: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: "India" },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: [
          "Cash on Delivery",
          "COD",
          "Online Payment",
          "Razorpay",
          "Online",
          "UPI",
          "UPI Payment",
          "Card",
          "Net Banking",
        ],
        default: "Cash on Delivery",
      },
      status: {
        type: String,
        enum: ["Pending", "Completed", "Failed", "Refunded"],
        default: "Pending",
      },
      transactionId: { type: String, default: "" },
      paidAt: { type: Date, default: null },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: "" },
      shippingFee: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    },
    totalAmount: { type: Number, required: true }, // Index helper
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Pending",
    },
    deliveryOption: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    tracking: {
      carrier: { type: String, default: "Express Courier" },
      trackingNumber: { type: String, default: "" },
      trackingUrl: { type: String, default: "" },
      estDeliveryDate: { type: Date },
      packageDetails: {
        weight: { type: Number, default: 0.5 },
        length: { type: Number, default: 15 },
        breadth: { type: Number, default: 15 },
        height: { type: Number, default: 10 },
        rate: { type: Number, default: 0 },
        courierId: { type: String, default: "" },
      },
      labelUrl: { type: String, default: "" },
      history: [trackingHistorySchema],
    },
    returnRequest: {
      status: {
        type: String,
        enum: [
          "None",
          "Requested",
          "Approved",
          "Rejected",
          "Item Picked Up",
          "Refund Processed",
          "Refunded",
        ],
        default: "None",
      },
      reason: { type: String, default: "" },
      comment: { type: String, default: "" },
      images: [{ type: String }],
      requestedAt: { type: Date, default: null },
      resolvedAt: { type: Date, default: null },
      adminNote: { type: String, default: "" },
      refundAmount: { type: Number, default: 0 },
      refundMode: { type: String, default: "Original Source" },
    },
    notes: { type: String, default: "" },
    cancelledReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
