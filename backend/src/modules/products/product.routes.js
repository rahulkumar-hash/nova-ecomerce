import { Router } from "express";
import {
  getAllProducts,
  getProductBySlugOrId,
  createProduct,
  updateProduct,
  deleteProduct,
  getBrands,
  subscribeStockAlert,
  getLowStockProducts,
} from "./product.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/brands", getBrands);
router.get("/admin/low-stock", adminVerifyJWT, getLowStockProducts);
router.get("/:identifier", getProductBySlugOrId);

router.post("/:id/notify-stock", subscribeStockAlert);
router.post("/", adminVerifyJWT, createProduct);
router.put("/:id", adminVerifyJWT, updateProduct);
router.delete("/:id", adminVerifyJWT, deleteProduct);

export default router;
