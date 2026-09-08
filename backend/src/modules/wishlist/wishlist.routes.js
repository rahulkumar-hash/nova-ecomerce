import { Router } from "express";
import { getWishlist, toggleWishlist } from "./wishlist.controller.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const router = Router();

router.use(verifyToken);
router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);

export default router;
