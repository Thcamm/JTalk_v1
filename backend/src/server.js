import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import config from "./config/index.js";
import { connectDB } from "./config/db.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();
const PORT = config.port;

// Ensure upload folder exists
const uploadDir = path.join(process.cwd(), "uploads", "audio");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Global Middlewares
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());

// 2. CORS Configuration
const allowedOrigins = [
  config.clientUrl,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, adjust for prod domain
    },
    credentials: true,
  })
);

// 3. Static audio files serving
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 4. API Routes Mounting
// Root healthcheck & status
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "🚀 JTalk Backend API Server is running",
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// Production standard API v1
app.use("/api/v1", apiRouter);

// Backward compatibility mount for current frontend
app.use("/api", apiRouter);

// Direct root mount fallback (in case client VITE_API_URL omits /api/v1 prefix)
app.use("/", apiRouter);

// 5. Centralized Error Handler Middleware
app.use(errorHandler);

// 6. Connect to MongoDB Atlas and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 JTalk Backend Server đang chạy trên cổng ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🌐 Môi trường: ${config.env}`);
    });
  })
  .catch((err) => {
    console.error("❌ Không thể kết nối MongoDB Atlas:", err);
    process.exit(1);
  });

export default app;
