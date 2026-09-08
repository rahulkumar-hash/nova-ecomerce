import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    tag: { type: String, default: "" }, // e.g. "Exclusive Deal", "New Arrival"
    image: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    link: { type: String, default: "/shop" },
    buttonText: { type: String, default: "Shop Now" },
    type: {
      type: String,
      enum: ["hero_slider", "promo_card", "announcement", "offer_strip"],
      default: "hero_slider",
    },
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    badgeColor: { type: String, default: "#6366f1" },
  },
  { timestamps: true }
);

export const Banner = mongoose.model("Banner", bannerSchema);
