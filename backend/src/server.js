import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import config from "./config/index.js";
import { connectDB } from "./config/db.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import CurriculumService from "./services/curriculum.service.js";

const app = express();
const PORT = config.port;

// Ensure upload folder exists
const uploadDir = path.join(process.cwd(), "uploads", "audio");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Auto-sync official MoMo QR image (Giữ mã QR 99k, xóa chữ 99.000đ & thu gọn khoảng trắng cho chuẩn đẹp)
try {
  const temp15 = "C:\\Users\\nguye\\AppData\\Local\\Temp\\claude\\d--FALL26-JTalk-v1\\d06463d3-9fb3-4dc4-8e38-fb80152044ee\\images\\15.png";
  const frontendPublicDir = path.resolve(process.cwd(), "..", "frontend", "public");
  const frontendMoMoPath = path.join(frontendPublicDir, "momo-qr.png");
  const backendMoMoPath = path.join(process.cwd(), "uploads", "momo-qr.png");

  if (fs.existsSync(temp15)) {
    const sharp = require(path.resolve(process.cwd(), "..", "frontend", "node_modules", "sharp"));
    const raw15 = await sharp(temp15).raw().toBuffer({ resolveWithObject: true });

    const width = raw15.info.width;
    const height = raw15.info.height;
    const channels = raw15.info.channels;

    // Cắt bỏ phần dư 120px ở đáy thẻ (nơi chứa chữ 99.000đ và đường kẻ ngang) để thẻ cân đối hoàn hảo
    const cutStart = 745;
    const cutEnd = 865;
    const cutHeight = cutEnd - cutStart;
    const newHeight = height - cutHeight;

    const compactBuffer = Buffer.alloc(width * newHeight * channels);

    // Phần trên (từ 0 đến cutStart): giữ nguyên 100% bao gồm cả QR code đã ghim 99k và logo VietQR Napas
    raw15.data.copy(compactBuffer, 0, 0, cutStart * width * channels);

    // Phần dưới (từ cutEnd đến hết): ghép nối liền đáy thẻ và tên tài khoản
    raw15.data.copy(
      compactBuffer,
      cutStart * width * channels,
      cutEnd * width * channels,
      height * width * channels
    );

    const processedPng = await sharp(compactBuffer, {
      raw: { width, height: newHeight, channels },
    })
      .png()
      .toBuffer();

    fs.writeFileSync(frontendMoMoPath, processedPng);
    fs.writeFileSync(backendMoMoPath, processedPng);

    // Dọn dẹp các tệp log tạm nếu có
    ["momo_debug.json", "momo_diff.json", "momo_rows.json", "momo_card_bottom.json", "momo_card_x.json", "momo_error.txt", "momo_default_keys.json", "momo_default.json", "momo_keys.json"].forEach((f) => {
      const p = path.join(process.cwd(), "uploads", f);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    });

    console.log("✅ Đã xử lý momo-qr.png: Cắt bỏ chữ 99.000đ, thu gọn thẻ cân đối và chuyên nghiệp");
  }
} catch (copyErr) {
  console.warn("⚠️ Đồng bộ momo-qr.png:", copyErr.message);
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
  .then(async () => {
    // Tự động kiểm tra và dọn dẹp các video trùng lặp khi khởi động
    try {
      await CurriculumService.cleanDuplicateVideos();
    } catch (cleanErr) {
      console.warn("⚠️ Tự động dọn dẹp video gặp lỗi nhỏ:", cleanErr?.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 JTalk Backend Server đang chạy trên cổng ${PORT}`);
      console.log(`📡 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🌐 Môi trường: ${config.env}`);
      console.log(`🏦 VietQR Gateway: [${config.vietqr.bankId}] STK: ${config.vietqr.accountNo} (${config.vietqr.accountName})`);
      console.log(`📱 MoMo Gateway: [${config.momo.bankId}] STK: ${config.momo.accountNo} (${config.momo.accountName})`);
    });
  })
  .catch((err) => {
    console.error("❌ Không thể kết nối MongoDB Atlas:", err);
    process.exit(1);
  });

export default app;
