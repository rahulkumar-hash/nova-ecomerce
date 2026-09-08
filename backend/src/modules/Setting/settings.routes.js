import { Router } from "express";
import { getStoreSettings, updateStoreSettings } from "./setting.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

router.get("/", getStoreSettings);
router.put("/", adminVerifyJWT, updateStoreSettings);
router.patch("/", adminVerifyJWT, updateStoreSettings);

export default router;
