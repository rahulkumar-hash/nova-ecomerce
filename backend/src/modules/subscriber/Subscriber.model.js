import mongoose from "mongoose";

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Subscriber email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
    couponCode: {
      type: String,
      default: "WELCOME15",
    },
    discountPercent: {
      type: Number,
      default: 15,
    },
    source: {
      type: String,
      default: "Homepage VIP Newsletter",
    },
    welcomeEmailSent: {
      type: Boolean,
      default: false,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Subscriber = mongoose.model("Subscriber", subscriberSchema);
