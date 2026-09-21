import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import StudyLog from "../models/StudyLog.js";
import { getTodayDateString } from "../utils/dateUtils.js";
import config from "../config/index.js";

export class UserService {
  /**
   * Retrieves comprehensive user profile with live subscription and streak data
   */
  static async getMe(userId) {
    const user = await User.findById(userId).select("-hashedPassword");
    if (!user) {
      const error = new Error("Không tìm thấy thông tin người dùng.");
      error.statusCode = 404;
      throw error;
    }

    const now = new Date();

    // Query active subscription from subscriptions collection
    const activeSub = await Subscription.findOne({
      userId,
      status: { $in: ["active", "ACTIVE"] },
      endDate: { $gt: now },
    }).sort({ endDate: -1 });

    const isPremium = !!activeSub;

    // Calculate today's quota usage
    const todayStr = getTodayDateString();
    const todayLog = await StudyLog.findOne({ userId, date: todayStr });
    const usedToday = todayLog ? todayLog.practiceCount : 0;
    const limit = config.quota.freeDailyPracticeLimit;
    const remaining = isPremium ? Infinity : Math.max(0, limit - usedToday);

    const subscriptionInfo = {
      isPremium,
      tier: isPremium ? "premium" : "free",
      status: activeSub ? activeSub.status : "free",
      planType: activeSub ? activeSub.planType : null,
      startDate: activeSub ? activeSub.startDate : null,
      endDate: activeSub ? activeSub.endDate : null,
      expires_at: activeSub ? activeSub.endDate : null,
    };

    const userObj = user.toObject();

    return {
      ...userObj,
      streak_count: user.gamification?.streak || 0,
      streak: user.gamification?.streak || 0,
      subscription: subscriptionInfo,
      quota: {
        isUnlimited: isPremium,
        limit: isPremium ? "unlimited" : limit,
        usedToday,
        remaining: isPremium ? "unlimited" : remaining,
      },
    };
  }

  /**
   * Updates user profile fields
   */
  static async updateProfile(userId, updateData) {
    const allowedFields = [
      "displayName",
      "avatarUrl",
      "bio",
      "phone",
      "profile",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates[field] = updateData[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true })
      .select("-hashedPassword");

    return updatedUser;
  }
}

export default UserService;
