import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import courseRoute from "./course.route.js";
import topicRoute from "./topic.route.js";
import lessonRoute from "./lesson.route.js";
import practiceRoute from "./practice.route.js";
import studylogRoute from "./studylog.route.js";
import paymentRoute from "./payment.route.js";

const router = express.Router();

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

export default router;
