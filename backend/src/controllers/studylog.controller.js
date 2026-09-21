import StudyLogService from "../services/studylog.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/studylogs/weekly (or /api/studylogs/weekly)
 * Fetches last 7 days study progress for the user to plot charts on Frontend
 */
export const getWeeklyStudyLogs = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const weeklyData = await StudyLogService.getWeeklyStudyData(userId);

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
