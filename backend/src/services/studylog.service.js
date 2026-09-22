import StudyLog from "../models/StudyLog.js";
import { getTodayDateString, getPastNDaysDates } from "../utils/dateUtils.js";

export class StudyLogService {
  /**
   * Records or increments today's study progress
   * @param {Object} params
   * @param {string} params.userId
   * @param {number} params.minutesSpent
   * @param {number} params.practiceCount
   * @param {number} params.xpEarned
   * @param {number} params.lessonsCompleted
   */
  static async recordStudyProgress({
    userId,
    minutesSpent = 1,
    practiceCount = 1,
    xpEarned = 10,
    lessonsCompleted = 0,
  }) {
    const todayStr = getTodayDateString();

    const log = await StudyLog.findOneAndUpdate(
      { userId, date: todayStr },
      {
        $inc: {
          minutesSpent,
          practiceCount,
          xpEarned,
          lessonsCompleted,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return log;
  }

  /**
   * Retrieves the past 7 days of study logs formatted for Frontend charts
   * @param {string} userId
   * @returns {Promise<Array<{day: string, date: string, minutesSpent: number, practiceCount: number, xpEarned: number}>>}
   */
  static async getWeeklyStudyData(userId) {
    const last7Dates = getPastNDaysDates(7); // ['2026-09-15', ..., '2026-09-21']

    const logs = await StudyLog.find({
      userId,
      date: { $in: last7Dates },
    });

    // Create lookup map by date
    const logMap = new Map();
    logs.forEach((log) => {
      logMap.set(log.date, log);
    });

    const vietnameseDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    // Format all 7 days in order
    const weeklyData = last7Dates.map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = vietnameseDays[dateObj.getDay()];

      const existing = logMap.get(dateStr);

      return {
        day: dayOfWeek,
        date: dateStr,
        minutesSpent: existing ? existing.minutesSpent : 0,
        practiceCount: existing ? existing.practiceCount : 0,
        xpEarned: existing ? existing.xpEarned : 0,
        lessonsCompleted: existing ? existing.lessonsCompleted : 0,
      };
    });

    return weeklyData;
  }
}

export default StudyLogService;
