import StudyLog from "../models/StudyLog.js";
import Practice from "../models/Practice.js";
import { checkUserPremiumSubscription } from "./premium.middleware.js";
import { getTodayDateString } from "../utils/dateUtils.js";
import config from "../config/index.js";
import { errorResponse } from "../utils/apiResponse.js";

/**
 * Middleware: Enforces daily speaking practice quota
 * - Premium User: Unlimited
 * - Free User: Maximum 2 practices per day
 */
export const checkPracticeQuota = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return errorResponse(res, "Vui lòng đăng nhập để luyện nói.", 401);
    }

    // 1. Kiểm tra trạng thái gói Premium từ collection subscriptions
    const { isPremium, subscription } = await checkUserPremiumSubscription(user._id);

    if (isPremium) {
      req.isPremium = true;
      req.subscription = subscription;
      req.quota = {
        isUnlimited: true,
        remaining: Infinity,
        limit: Infinity,
        usedToday: 0,
      };
      return next();
    }

    // 2. Với User FREE: Kiểm tra số lượt luyện tập hôm nay
    const todayStr = getTodayDateString();
    const freeLimit = config.quota.freeDailyPracticeLimit; // Mặc định 2 lượt/ngày

    // Kiểm tra số lượt đã thực hành hôm nay từ StudyLog
    const todayLog = await StudyLog.findOne({
      userId: user._id,
      date: todayStr,
    });

    let usedToday = todayLog ? todayLog.practiceCount : 0;

    // Fallback: nếu chưa có log hoặc muốn đối soát chính xác với collection practices
    if (usedToday === 0) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      usedToday = await Practice.countDocuments({
        userId: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
    }

    if (usedToday >= freeLimit) {
      return errorResponse(
        res,
        `Bạn đã sử dụng hết ${freeLimit} lượt luyện nói miễn phí trong ngày hôm nay. Vui lòng nâng cấp gói Premium (99.000đ/tháng) để luyện tập không giới hạn!`,
        403,
        {
          quotaExceeded: true,
          limit: freeLimit,
          usedToday,
          remaining: 0,
          upgradeUrl: "/pricing",
        }
      );
    }

    req.isPremium = false;
    req.quota = {
      isUnlimited: false,
      limit: freeLimit,
      usedToday,
      remaining: Math.max(0, freeLimit - usedToday),
    };

    next();
  } catch (error) {
    console.error("Lỗi trong checkPracticeQuota middleware:", error);
    return errorResponse(res, "Lỗi kiểm tra hạn mức luyện tập", 500);
  }
};
