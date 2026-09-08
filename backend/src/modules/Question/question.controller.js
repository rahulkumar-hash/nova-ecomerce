import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Question } from "./Question.model.js";
import { Product } from "../products/product.modal.js";

export const getProductQuestions = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let targetId = productId;

  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    const p = await Product.findOne({ slug: productId });
    if (p) targetId = p._id;
  }

  const questions = await Question.find({ product: targetId, isApproved: true })
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, questions, "Product questions fetched"));
});

export const askQuestion = asyncHandler(async (req, res) => {
  const { productId, question } = req.body;

  if (!productId || !question || !question.trim()) {
    throw new ApiError(400, "Product ID and question text are required");
  }

  let targetId = productId;
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    const p = await Product.findOne({ slug: productId });
    if (!p) throw new ApiError(404, "Product not found");
    targetId = p._id;
  }

  const newQ = await Question.create({
    product: targetId,
    user: req.user._id,
    userName: req.user.name || "Customer",
    userAvatar: req.user.avatar || "",
    question: question.trim(),
    isApproved: true,
  });

  return res.status(201).json(new ApiResponse(201, newQ, "Question submitted successfully!"));
});

export const adminAnswerQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answer, isApproved } = req.body;

  const q = await Question.findById(id);
  if (!q) throw new ApiError(404, "Question not found");

  if (answer !== undefined) {
    q.answer = answer.trim();
    q.answeredBy = req.admin?.name || "Official Support";
    q.answeredAt = new Date();
  }

  if (isApproved !== undefined) {
    q.isApproved = Boolean(isApproved);
  }

  await q.save();
  return res.status(200).json(new ApiResponse(200, q, "Question answered successfully"));
});

export const adminGetAllQuestions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = "", status = "all" } = req.query;

  const filter = {};
  if (status === "pending") {
    filter.$or = [{ answer: "" }, { answer: { $exists: false } }, { answer: null }];
  } else if (status === "answered") {
    filter.answer = { $nin: ["", null] };
  }

  if (search && search.trim()) {
    const searchCondition = [
      { question: { $regex: search.trim(), $options: "i" } },
      { answer: { $regex: search.trim(), $options: "i" } },
      { userName: { $regex: search.trim(), $options: "i" } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchCondition }];
      delete filter.$or;
    } else {
      filter.$or = searchCondition;
    }
  }

  const questions = await Question.find(filter)
    .populate("product", "name slug thumbnail")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Question.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      { questions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      "All questions fetched"
    )
  );
});

export const adminDeleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const q = await Question.findByIdAndDelete(id);
  if (!q) throw new ApiError(404, "Question not found");

  return res.status(200).json(new ApiResponse(200, {}, "Question deleted successfully"));
});
