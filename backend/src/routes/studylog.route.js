import express from "express";
import { getWeeklyStudyLogs } from "../controllers/studylog.controller.js";
import { protectedRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectedRoute);

// GET /api/v1/studylogs/weekly (or /api/studylogs/weekly)
router.get("/weekly", getWeeklyStudyLogs);

export default router;
