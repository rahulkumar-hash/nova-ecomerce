import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 E-Commerce Server running on http://localhost:${PORT}`);
      console.log(`📦 Healthcheck: http://localhost:${PORT}/health`);
      console.log(`===============================================`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
