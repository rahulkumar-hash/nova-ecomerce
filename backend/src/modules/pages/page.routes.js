import { Router } from "express";
import {
  getAllPages,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  resetDefaultPages,
} from "./page.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Public routes for storefront
router.get("/", getAllPages);
router.get("/:slug", getPageBySlug);

// Protected Admin CMS routes
router.post("/", adminVerifyJWT, createPage);
router.put("/:id", adminVerifyJWT, updatePage);
router.post("/reset-defaults", adminVerifyJWT, resetDefaultPages);
router.delete("/:id", adminVerifyJWT, deletePage);

export default router;
