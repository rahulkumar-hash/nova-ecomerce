import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      default: "Verified Customer",
    },
    userAvatar: {
      type: String,
      default: "",
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      default: "",
      trim: true,
    },
    answeredBy: {
      type: String,
      default: "",
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);
