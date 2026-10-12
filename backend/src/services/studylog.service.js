import StudyLog from "../models/StudyLog.js";
import User from "../models/User.js";
import {
  getTodayDateString,
  getPastNDaysDates,
  calculateNewStreak,
} from "../utils/dateUtils.js";

export class StudyLogService {
  /**
   * Records or increments today's study progress
   * @param {Object} params
   * @param {string} params.userId
   * @param {number} params.minutesSpent
   * @param {number} params.practiceCount
   * @param {number} params.xpEarned
   * @param {number} params.lessonsCompleted
   * @param {string} [params.clientDate]
   */
  static async recordStudyProgress({
    userId,
    minutesSpent = 1,
    practiceCount = 1,
    xpEarned = 10,
    lessonsCompleted = 0,
    clientDate = null,
  }) {
    const todayStr = getTodayDateString(clientDate);

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
   * Performs authentic daily check-in with Hanko stamp, increments streak and rewards XP
   * @param {string} userId
   * @param {string} [clientDate] - optional YYYY-MM-DD from client's local timezone
   */
  static async performDailyCheckIn(userId, clientDate = null) {
    const todayStr = getTodayDateString(clientDate);
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Không tìm thấy thông tin người dùng.");
      error.statusCode = 404;
      throw error;
    }

    // Check if user already stamped / checked in today
    const existingLog = await StudyLog.findOne({ userId, date: todayStr });
    if (existingLog && existingLog.checkedIn) {
      return {
        success: true,
        alreadyCheckedIn: true,
        message: "Hôm nay bạn đã hoàn thành điểm danh rồi! Hãy tiếp tục duy trì nhé.",
        streak: user.gamification?.streak || 1,
        longestStreak: user.gamification?.longestStreak || 1,
        totalXp: user.gamification?.totalXp || 0,
        level: user.gamification?.level || 1,
        xpEarned: 0,
        todayLog: existingLog,
      };
    }

    // Calculate streak accurately
    const currentStreak = user.gamification?.streak || 0;
    const currentLongest = user.gamification?.longestStreak || 0;
    const lastActive = user.gamification?.lastActiveDate;

    const streakResult = calculateNewStreak(
      lastActive,
      currentStreak,
      currentLongest,
      clientDate,
      user.gamification?.streakFreeze
    );

    const CHECKIN_XP_BONUS = 20;
    const CHECKIN_MINUTES_BONUS = 5;

    // 1. Update User Gamification & Daily Usage
    const newTotalXp = (user.gamification?.totalXp || 0) + CHECKIN_XP_BONUS;
    const newLevel = Math.max(1, Math.floor(newTotalXp / 100) + 1);

    user.gamification = {
      ...user.gamification,
      streak: streakResult.newStreak,
      longestStreak: streakResult.newLongestStreak,
      lastActiveDate: new Date(),
      totalXp: newTotalXp,
      level: newLevel,
      streakFreeze: streakResult.freezeUsed
        ? {
            equipped: streakResult.remainingFreeze,
            lastUsedAt: new Date(),
          }
        : user.gamification?.streakFreeze,
    };

    const currentDailyPractices =
      user.dailyUsage?.date === todayStr ? user.dailyUsage.practiceCount || 0 : 0;
    const currentDailyMinutes =
      user.dailyUsage?.date === todayStr ? user.dailyUsage.minutesSpent || 0 : 0;

    user.dailyUsage = {
      date: todayStr,
      practiceCount: Math.max(1, currentDailyPractices + (existingLog ? 0 : 1)),
      minutesSpent: currentDailyMinutes + CHECKIN_MINUTES_BONUS,
    };

    await user.save();

    // 2. Upsert today's StudyLog record
    const updatedLog = await StudyLog.findOneAndUpdate(
      { userId, date: todayStr },
      {
        $set: { checkedIn: true },
        $inc: {
          minutesSpent: CHECKIN_MINUTES_BONUS,
          xpEarned: CHECKIN_XP_BONUS,
          practiceCount: existingLog ? 0 : 1,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const freezeNotice = streakResult.freezeUsed
      ? " ❄️ Bùa bảo vệ chuỗi đã tự động cứu streak của bạn hôm qua!"
      : "";

    return {
      success: true,
      alreadyCheckedIn: false,
      message: `Điểm danh thành công! Bạn nhận được +${CHECKIN_XP_BONUS} XP và chuỗi streak đạt ${streakResult.newStreak} ngày 🎉${freezeNotice}`,
      streak: streakResult.newStreak,
      longestStreak: streakResult.newLongestStreak,
      totalXp: newTotalXp,
      level: newLevel,
      xpEarned: CHECKIN_XP_BONUS,
      todayLog: updatedLog,
      freezeUsed: streakResult.freezeUsed,
      streakFreeze: user.gamification.streakFreeze,
    };
  }

  /**
   * Retrieves the past 7 days of study logs formatted for Frontend charts
   * @param {string} userId
   * @param {string} [clientDate]
   * @returns {Promise<Array<{day: string, date: string, minutesSpent: number, practiceCount: number, xpEarned: number, checkedIn: boolean}>>}
   */
  static async getWeeklyStudyData(userId, clientDate = null) {
    const last7Dates = getPastNDaysDates(7, clientDate);

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
      const dateObj = new Date(year, month - 1, day, 12, 0, 0);
      const dayOfWeek = vietnameseDays[dateObj.getDay()];

      const existing = logMap.get(dateStr);

      return {
        day: dayOfWeek,
        date: dateStr,
        minutesSpent: existing ? existing.minutesSpent : 0,
        practiceCount: existing ? existing.practiceCount : 0,
        xpEarned: existing ? existing.xpEarned : 0,
        lessonsCompleted: existing ? existing.lessonsCompleted : 0,
        checkedIn: existing ? !!existing.checkedIn : false,
      };
    });

    return weeklyData;
  }
}

export default StudyLogService;
