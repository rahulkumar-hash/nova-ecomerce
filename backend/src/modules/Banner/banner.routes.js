import { Router } from "express";
import {
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "./banner.controler.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

router.get("/", getAllBanners);
router.post("/", adminVerifyJWT, createBanner);
router.put("/:id", adminVerifyJWT, updateBanner);
router.delete("/:id", adminVerifyJWT, deleteBanner);

export default router;
