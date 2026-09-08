import express from "express";
import compression from "compression";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);
app.use(compression());
app.use(morgan("dev"));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
  })
);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:8000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// If CORS_ORIGINS is set to * allow all origins
const corsAllowAll = allowedOrigins.includes("*");

app.use(
  cors({
    origin: (origin, callback) => {
      // Preflight and server-to-server requests (no origin header)
      if (!origin) return callback(null, true);
      // Wildcard: allow all
      if (corsAllowAll) return callback(null, true);
      // Allow localhost in any environment
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) return callback(null, true);
      // Allow any onrender.com subdomain
      if (origin.endsWith(".onrender.com")) return callback(null, true);
      // Allow vercel, netlify, github pages
      if (origin.endsWith(".vercel.app") || origin.endsWith(".netlify.app") || origin.endsWith(".github.io")) return callback(null, true);
      // Allow explicit origins from env
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow everything else in development
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      return callback(null, true); // be permissive — block at auth layer instead
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "x-gemini-key"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Handle preflight for all routes
app.options("*", cors());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

// API Master Routes
app.use("/api/v1", routes);
app.use("/api", routes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "Single Vendor E-commerce API is healthy and operational",
    timestamp: new Date(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;
