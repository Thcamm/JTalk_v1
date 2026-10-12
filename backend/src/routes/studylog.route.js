import express from "express";
import { getWeeklyStudyLogs, dailyCheckIn } from "../controllers/studylog.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectedRoute);

// GET /api/v1/studylogs/weekly (or /api/studylogs/weekly)
router.get("/weekly", getWeeklyStudyLogs);

// POST /api/v1/studylogs/checkin
router.post("/checkin", dailyCheckIn);

export default router;
