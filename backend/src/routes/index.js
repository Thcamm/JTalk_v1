import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import courseRoute from "./course.route.js";
import topicRoute from "./topic.route.js";
import lessonRoute from "./lesson.route.js";
import practiceRoute from "./practice.route.js";
import studylogRoute from "./studylog.route.js";
import paymentRoute from "./payment.route.js";
import adminRoute from "./admin.route.js";

const router = express.Router();

// Root v1 welcome & status
router.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "🚀 JTalk Backend API v1 is running smoothly",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      courses: "/api/v1/courses",
      topics: "/api/v1/topics",
      lessons: "/api/v1/lessons",
      practices: "/api/v1/practices",
      studylogs: "/api/v1/studylogs",
      payments: "/api/v1/payments",
    },
  });
});

// Health Check API
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount all v1 routes
router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/courses", courseRoute);
router.use("/topics", topicRoute);
router.use("/lessons", lessonRoute);
router.use("/practices", practiceRoute);
router.use("/studylogs", studylogRoute);
router.use("/payments", paymentRoute);
router.use("/admin", adminRoute);

export default router;
