import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "./cart.controler.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = Router();

router.use(verifyToken);
router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item/:itemId", updateCartItemQuantity);
router.delete("/item/:itemId", removeCartItem);
router.delete("/clear", clearCart);

export default router;
