import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Page title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Page slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: [true, "Page content is required"],
    },
    excerpt: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["legal", "company", "support", "custom"],
      default: "legal",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    metaTitle: {
      type: String,
      default: "",
    },
    metaDescription: {
      type: String,
      default: "",
    },
    sections: [
      {
        heading: { type: String, default: "" },
        body: { type: String, default: "" },
      },
    ],
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

export const Page = mongoose.model("Page", pageSchema);
