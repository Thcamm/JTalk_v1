import StudyLogService from "../services/studylog.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/studylogs/weekly (or /api/studylogs/weekly)
 * Fetches last 7 days study progress for the user to plot charts on Frontend
 */
export const getWeeklyStudyLogs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const clientDate = req.query.date || null;
    const weeklyData = await StudyLogService.getWeeklyStudyData(userId, clientDate);

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu tiến độ 7 ngày gần nhất thành công!",
      data: weeklyData,
      weeklyData, // Direct access for frontend
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/studylogs/checkin
 * Performs authentic daily check-in with Hanko stamp and updates streak & XP
 */
export const dailyCheckIn = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const clientDate = req.body?.date || null;

    const result = await StudyLogService.performDailyCheckIn(userId, clientDate);
    const weeklyData = await StudyLogService.getWeeklyStudyData(userId, clientDate);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
      ...result,
      weeklyData,
    });
  } catch (error) {
    next(error);
  }
};

