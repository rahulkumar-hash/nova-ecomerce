import { Router } from "express";
import { handleAiCommand } from "./ai.controller.js";
import { adminVerifyJWT } from "../../middlewares/adminVerifyJWT.js";

const router = Router();

// Check AI status and mode
router.get("/status", adminVerifyJWT, (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.status(200).json({
    success: true,
    data: {
      status: "ready",
      modes: ["local", "gemini"],
      activeMode: hasGeminiKey ? "gemini" : "local",
      hasServerGeminiKey: hasGeminiKey,
      hybridSupported: true,
    },
  });
});

// Execute or propose AI command
router.post("/command", adminVerifyJWT, handleAiCommand);

export default router;
