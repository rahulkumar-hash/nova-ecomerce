import { Router } from "express";
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug);

router.post("/", adminVerifyJWT, createCategory);
router.put("/:id", adminVerifyJWT, updateCategory);
router.delete("/:id", adminVerifyJWT, deleteCategory);

export default router;
