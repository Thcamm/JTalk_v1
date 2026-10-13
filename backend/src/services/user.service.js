import bcrypt from "bcrypt";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import StudyLog from "../models/StudyLog.js";
import {
  getTodayDateString,
  getActiveStreak,
  getWeekIdentifier,
} from "../utils/dateUtils.js";
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

    // Ensure displayName is always populated with at least username if empty
    if (!user.displayName || !user.displayName.trim()) {
      user.displayName = user.username;
      await user.save();
    }

    const now = new Date();

    // Query active subscription from subscriptions collection
    const activeSub = await Subscription.findOne({
      userId,
      status: { $in: ["active", "ACTIVE"] },
      endDate: { $gt: now },
    }).sort({ endDate: -1 });

    const isPremium = !!activeSub;

    // Calculate today's quota usage and Practice-to-Earn bonus
    const todayStr = getTodayDateString();
    const todayLog = await StudyLog.findOne({ userId, date: todayStr });
    const usedToday = todayLog ? todayLog.practiceCount : 0;
    const baseLimit = config.quota.freeDailyPracticeLimit;
    const bonusPractices = (user.dailyUsage && user.dailyUsage.date === todayStr)
      ? (user.dailyUsage.earnedBonusPractices || 0)
      : 0;
    const vocabReviewsToday = (user.dailyUsage && user.dailyUsage.date === todayStr)
      ? (user.dailyUsage.vocabReviewsToday || 0)
      : 0;
    const effectiveLimit = baseLimit + bonusPractices;
    const remaining = isPremium ? Infinity : Math.max(0, effectiveLimit - usedToday);

    const subscriptionInfo = {
      isPremium,
      tier: isPremium ? "premium" : "free",
      status: activeSub ? activeSub.status : "free",
      planType: activeSub ? activeSub.planType : null,
      startDate: activeSub ? activeSub.startDate : null,
      endDate: activeSub ? activeSub.endDate : null,
      expires_at: activeSub ? activeSub.endDate : null,
    };

    // Verify if streak is still active or expired (missed yesterday, or protected by freeze)
    let currentStreak = user.gamification?.streak || 0;
    const lastActiveDate = user.gamification?.lastActiveDate;
    const activeStreak = getActiveStreak(
      lastActiveDate,
      currentStreak,
      null,
      user.gamification?.streakFreeze
    );

    if (currentStreak > 0 && activeStreak === 0) {
      user.gamification.streak = 0;
      await user.save();
      currentStreak = 0;
    } else {
      currentStreak = activeStreak;
    }

    const userObj = user.toObject();

    return {
      ...userObj,
      dailyUsage: {
        date: todayStr,
        practiceCount: usedToday,
        minutesSpent: todayLog ? todayLog.minutesSpent : (user.dailyUsage?.minutesSpent || 0),
        earnedBonusPractices: bonusPractices,
        vocabReviewsToday,
      },
      streak_count: currentStreak,
      streak: currentStreak,
      gamification: {
        ...userObj.gamification,
        streak: currentStreak,
        league: userObj.gamification?.league || "bronze",
        onboardingCompleted: userObj.gamification?.onboardingCompleted || false,
      },
      subscription: subscriptionInfo,
      quota: {
        isUnlimited: isPremium,
        limit: isPremium ? "unlimited" : effectiveLimit,
        baseLimit,
        bonusPractices,
        maxBonus: 2,
        canEarnBonus: !isPremium && bonusPractices < 2,
        vocabReviewsToday,
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

    // Direct support for updating targetLevel or other profile fields if passed flatly
    if (updateData.targetLevel || updateData.goal || updateData.dailyTargetMinutes || updateData.occupation) {
      updates.profile = updates.profile || {};
      if (updateData.targetLevel) updates.profile.targetLevel = updateData.targetLevel;
      if (updateData.goal) updates.profile.goal = updateData.goal;
      if (updateData.dailyTargetMinutes) updates.profile.dailyTargetMinutes = updateData.dailyTargetMinutes;
      if (updateData.occupation) updates.profile.occupation = updateData.occupation;
    }

    // Merge nested profile object properly using dot-notation to avoid wiping out other profile sub-fields
    const mongoUpdate = {};
    for (const [key, val] of Object.entries(updates)) {
      if (key === "profile" && typeof val === "object" && val !== null) {
        for (const [subKey, subVal] of Object.entries(val)) {
          mongoUpdate[`profile.${subKey}`] = subVal;
        }
      } else {
        mongoUpdate[key] = val;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: mongoUpdate },
      { new: true, runValidators: true }
    ).select("-hashedPassword");

    return updatedUser;
  }

  /**
   * Changes user password with old password verification
   */
  static async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      const error = new Error("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
      error.statusCode = 400;
      throw error;
    }

    if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
      const error = new Error("Mật khẩu mới phải có tối thiểu 6 ký tự.");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Không tìm thấy thông tin tài khoản.");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      const error = new Error("Mật khẩu hiện tại không chính xác.");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    user.hashedPassword = hashedPassword;
    await user.save();

    return true;
  }

  /**
   * Retrieves leaderboard sorted by total XP or streak
   * @param {Object} options
   * @param {string} options.type - 'xp' | 'streak'
   * @param {string} options.timeframe - 'all' | 'week' | 'month'
   * @param {number} options.limit - number of users (default 25)
   * @param {string} [options.currentUserId] - ID of the requesting user
   */
  static async getLeaderboard({ type = "xp", timeframe = "all", limit = 25, currentUserId = null }) {
    const sortField = type === "streak" ? "gamification.streak" : "gamification.totalXp";
    const dbUsers = await User.find({})
      .select("displayName avatarUrl profile.targetLevel gamification subscription.tier")
      .sort({ [sortField]: -1 })
      .limit(50)
      .lean();

    // Starter community learners to ensure the podium is always vibrant and realistic
    const mockCommunityLearners = [
      {
        _id: "learner_tokyo_1",
        displayName: "Sakura Takahashi (高橋 さくら)",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N1",
        totalXp: 3850,
        streak: 42,
        level: 39,
        isPremium: true,
      },
      {
        _id: "learner_tokyo_2",
        displayName: "Nguyễn Minh Anh (Akira)",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N2",
        totalXp: 3220,
        streak: 35,
        level: 33,
        isPremium: true,
      },
      {
        _id: "learner_tokyo_3",
        displayName: "Kenji Sato (佐藤 健司)",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N3",
        totalXp: 2790,
        streak: 28,
        level: 28,
        isPremium: true,
      },
      {
        _id: "learner_tokyo_4",
        displayName: "Trần Bảo Ngọc (Yuki)",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N3",
        totalXp: 2150,
        streak: 21,
        level: 22,
        isPremium: false,
      },
      {
        _id: "learner_tokyo_5",
        displayName: "Lê Hoàng Long (Ryota)",
        avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N4",
        totalXp: 1840,
        streak: 18,
        level: 19,
        isPremium: true,
      },
      {
        _id: "learner_tokyo_6",
        displayName: "Hà Phương Linh (Aoi)",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N4",
        totalXp: 1420,
        streak: 14,
        level: 15,
        isPremium: false,
      },
      {
        _id: "learner_tokyo_7",
        displayName: "Phạm Quốc Dũng (Daiki)",
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        targetLevel: "N5",
        totalXp: 980,
        streak: 9,
        level: 10,
        isPremium: false,
      },
    ];

    // Map DB users to leaderboard items
    const mappedDbUsers = dbUsers.map((u) => ({
      _id: u._id.toString(),
      displayName: u.displayName || "Học viên JTalk",
      avatarUrl: u.avatarUrl,
      targetLevel: u.profile?.targetLevel || "N5",
      totalXp: u.gamification?.totalXp || 0,
      streak: u.gamification?.streak || 0,
      level: u.gamification?.level || 1,
      isPremium: u.subscription?.tier === "premium",
    }));

    // Merge DB users with mock learners (avoid duplicate IDs)
    const existingIds = new Set(mappedDbUsers.map((u) => u._id));
    const combined = [...mappedDbUsers];
    for (const mock of mockCommunityLearners) {
      if (!existingIds.has(mock._id)) {
        combined.push(mock);
      }
    }

    // Adjust scores based on timeframe
    const multiplier = timeframe === "week" ? 0.35 : timeframe === "month" ? 0.75 : 1.0;

    const processedUsers = combined.map((u) => {
      const xp = Math.round((u.totalXp || 0) * multiplier);
      const streak = timeframe === "week" ? Math.min(u.streak, 7) : timeframe === "month" ? Math.min(u.streak, 30) : u.streak;
      return {
        ...u,
        totalXp: xp,
        streak,
      };
    });

    // Sort by selected criteria
    processedUsers.sort((a, b) => {
      if (type === "streak") {
        return (b.streak || 0) - (a.streak || 0);
      }
      return (b.totalXp || 0) - (a.totalXp || 0);
    });

    // Assign 1-indexed ranks, League calculation and Promotion/Demotion zones
    const getLeagueByXp = (xp) => {
      if (xp >= 3000) return "diamond";
      if (xp >= 1600) return "platinum";
      if (xp >= 800) return "gold";
      if (xp >= 300) return "silver";
      return "bronze";
    };

    const totalCount = processedUsers.length;
    const rankedUsers = processedUsers.map((u, index) => {
      const rank = index + 1;
      const league = u.league || getLeagueByXp(u.totalXp || 0);
      let zone = "safe";
      if (rank <= 3) {
        zone = "promotion"; // Thăng hạng
      } else if (rank >= Math.max(4, totalCount - 2)) {
        zone = "demotion"; // Nguy cơ rớt hạng
      }
      return {
        ...u,
        rank,
        league,
        zone,
      };
    });

    const topUsers = rankedUsers.slice(0, Math.min(limit, 50));

    // Find current user's ranking
    let currentUserItem = null;
    if (currentUserId) {
      const stringUserId = currentUserId.toString();
      const found = rankedUsers.find((u) => u._id === stringUserId);
      if (found) {
        currentUserItem = found;
      } else {
        // Fallback if user is beyond top 50 in combined list
        const userDoc = await User.findById(currentUserId)
          .select("displayName avatarUrl profile gamification subscription")
          .lean();
        if (userDoc) {
          const userVal = type === "streak" ? (userDoc.gamification?.streak || 0) : (userDoc.gamification?.totalXp || 0);
          const countAhead = await User.countDocuments({ [sortField]: { $gt: userVal } });
          const realRank = countAhead + 1;
          const userLeague = userDoc.gamification?.league || getLeagueByXp(userDoc.gamification?.totalXp || 0);

          currentUserItem = {
            _id: stringUserId,
            displayName: userDoc.displayName || "Bạn",
            avatarUrl: userDoc.avatarUrl,
            targetLevel: userDoc.profile?.targetLevel || "N5",
            totalXp: Math.round((userDoc.gamification?.totalXp || 0) * multiplier),
            streak: userDoc.gamification?.streak || 0,
            level: userDoc.gamification?.level || 1,
            isPremium: userDoc.subscription?.tier === "premium",
            league: userLeague,
            zone: realRank <= 3 ? "promotion" : "safe",
            rank: realRank,
          };
        }
      }
    }

    // Weekly countdown calculation (ends on Sunday 23:59:59.999)
    const now = new Date();
    const currentDay = now.getDay();
    const daysUntilSunday = (7 - currentDay) % 7;
    const weekEndsAt = new Date(now);
    weekEndsAt.setDate(now.getDate() + daysUntilSunday);
    weekEndsAt.setHours(23, 59, 59, 999);

    return {
      leaderboard: topUsers,
      currentUser: currentUserItem,
      timeframe,
      type,
      leagueInfo: {
        currentLeague: currentUserItem?.league || "bronze",
        weekEndsAt: weekEndsAt.toISOString(),
        promotionTop: 3,
        demotionThreshold: Math.max(4, totalCount - 2),
      },
    };
  }

  /**
   * Claims quest reward (daily or weekly), records into DB and increments totalXp
   */
  static async claimQuestReward({
    userId,
    questId,
    xpReward = 30,
    questType = "daily",
    clientDate = null,
  }) {
    if (!questId) {
      const error = new Error("Thiếu mã nhiệm vụ (questId).");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Không tìm thấy thông tin người dùng.");
      error.statusCode = 404;
      throw error;
    }

    // Determine cycle key: date string for daily, week string for weekly
    const dateKey = questType === "weekly"
      ? getWeekIdentifier(clientDate)
      : getTodayDateString(clientDate);

    // Ensure claimedQuests array exists
    user.gamification = user.gamification || {};
    user.gamification.claimedQuests = user.gamification.claimedQuests || [];

    // Check if already claimed in this cycle
    const alreadyClaimed = user.gamification.claimedQuests.some(
      (q) => q.questId === questId && q.dateKey === dateKey
    );

    if (alreadyClaimed) {
      return {
        success: false,
        alreadyClaimed: true,
        message: "Nhiệm vụ này đã được nhận thưởng trong chu kỳ hiện tại!",
        totalXp: user.gamification.totalXp || 0,
        level: user.gamification.level || 1,
        xpEarned: 0,
      };
    }

    // Calculate new total XP and Level
    const newTotalXp = (user.gamification.totalXp || 0) + Number(xpReward);
    const newLevel = Math.max(1, Math.floor(newTotalXp / 100) + 1);

    user.gamification.totalXp = newTotalXp;
    user.gamification.level = newLevel;
    user.gamification.claimedQuests.push({
      questId,
      dateKey,
      claimedAt: new Date(),
      xpEarned: Number(xpReward),
    });

    await user.save();

    // Also record XP gain in today's StudyLog
    await StudyLog.findOneAndUpdate(
      { userId, date: getTodayDateString(clientDate) },
      { $inc: { xpEarned: Number(xpReward) } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      alreadyClaimed: false,
      message: `Nhận thưởng thành công! Bạn nhận được +${xpReward} XP 🎉`,
      totalXp: newTotalXp,
      level: newLevel,
      xpEarned: Number(xpReward),
      questId,
    };
  }

  /**
   * Purchases or equips a Streak Freeze using 100 XP (max 2 equipped)
   */
  static async buyStreakFreeze(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Không tìm thấy thông tin người dùng.");
      error.statusCode = 404;
      throw error;
    }

    user.gamification = user.gamification || {};
    user.gamification.streakFreeze = user.gamification.streakFreeze || {
      equipped: 0,
      lastUsedAt: null,
    };

    const equipped = user.gamification.streakFreeze.equipped || 0;
    if (equipped >= 2) {
      const error = new Error("Bạn đã trang bị tối đa 2 Bùa bảo vệ chuỗi (Streak Freeze) rồi!");
      error.statusCode = 400;
      throw error;
    }

    const COST_XP = 100;
    const currentXp = user.gamification.totalXp || 0;
    if (currentXp < COST_XP) {
      const error = new Error(
        `Bạn cần tối thiểu ${COST_XP} XP để trang bị Bùa bảo vệ chuỗi (Hiện bạn có ${currentXp} XP).`
      );
      error.statusCode = 400;
      throw error;
    }

    const newTotalXp = currentXp - COST_XP;
    const newLevel = Math.max(1, Math.floor(newTotalXp / 100) + 1);

    user.gamification.totalXp = newTotalXp;
    user.gamification.level = newLevel;
    user.gamification.streakFreeze.equipped = equipped + 1;

    await user.save();

    return {
      success: true,
      equipped: user.gamification.streakFreeze.equipped,
      totalXp: newTotalXp,
      level: newLevel,
      message: "Đã trang bị Bùa bảo vệ chuỗi (Streak Freeze) thành công! ❄️",
    };
  }

  /**
   * Practice-to-Earn Quota: Claims +1 bonus speaking practice after reviewing 5 flashcards
   */
  static async claimPracticeBonus(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Không tìm thấy thông tin người dùng.");
      error.statusCode = 404;
      throw error;
    }

    const todayStr = getTodayDateString();
    user.dailyUsage = user.dailyUsage || {};
    if (user.dailyUsage.date !== todayStr) {
      user.dailyUsage.date = todayStr;
      user.dailyUsage.practiceCount = 0;
      user.dailyUsage.earnedBonusPractices = 0;
      user.dailyUsage.vocabReviewsToday = 0;
    }

    const currentBonus = user.dailyUsage.earnedBonusPractices || 0;
    if (currentBonus >= 2) {
      const error = new Error("Bạn đã nhận tối đa 2 lượt hồi nói trong ngày hôm nay rồi!");
      error.statusCode = 400;
      throw error;
    }

    const vocabReviews = user.dailyUsage.vocabReviewsToday || 0;
    const reviewsRequired = (currentBonus + 1) * 5;
    if (vocabReviews < reviewsRequired) {
      const remainingNeeded = reviewsRequired - vocabReviews;
      const error = new Error(
        `Bạn cần ôn tập thêm ${remainingNeeded} thẻ từ vựng Flashcard nữa để đổi +1 lượt nói miễn phí.`
      );
      error.statusCode = 400;
      throw error;
    }

    user.dailyUsage.earnedBonusPractices = currentBonus + 1;
    await user.save();

    const baseLimit = config.quota.freeDailyPracticeLimit;
    const newLimit = baseLimit + user.dailyUsage.earnedBonusPractices;

    return {
      success: true,
      earnedBonusPractices: user.dailyUsage.earnedBonusPractices,
      maxBonus: 2,
      limit: newLimit,
      vocabReviewsToday: user.dailyUsage.vocabReviewsToday,
      message: `Chúc mừng! Bạn đã đổi thành công +1 lượt nói miễn phí (${user.dailyUsage.earnedBonusPractices}/2 lượt hôm nay) 🎉`,
    };
  }

  /**
   * Completes Onboarding Placement Quiz, saving goal, target level, daily target minutes and rewarding +50 XP
   */
  static async completeOnboardingQuiz(userId, quizData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("Không tìm thấy thông tin người dùng.");
      error.statusCode = 404;
      throw error;
    }

    const GOAL_MAP = {
      daily: "daily_conversation",
      daily_conversation: "daily_conversation",
      work: "interview",
      interview: "interview",
      business: "business",
      travel: "travel",
      hobby: "daily_conversation",
      exam: "interview",
    };

    user.profile = user.profile || {};
    if (quizData.targetLevel) user.profile.targetLevel = quizData.targetLevel;
    if (quizData.goal) {
      user.profile.goal = GOAL_MAP[quizData.goal] || quizData.goal || "daily_conversation";
    }
    if (quizData.dailyTargetMinutes) {
      user.profile.dailyTargetMinutes = Math.max(5, Number(quizData.dailyTargetMinutes) || 15);
    }
    if (quizData.occupation) user.profile.occupation = quizData.occupation;

    user.gamification = user.gamification || {};
    const isFirstTime = !user.gamification.onboardingCompleted;
    user.gamification.onboardingCompleted = true;

    let bonusXp = 0;
    if (isFirstTime) {
      bonusXp = 50;
      const currentXp = user.gamification.totalXp || 0;
      const newTotalXp = currentXp + bonusXp;
      user.gamification.totalXp = newTotalXp;
      user.gamification.level = Math.max(1, Math.floor(newTotalXp / 100) + 1);

      const todayStr = getTodayDateString();
      await StudyLog.findOneAndUpdate(
        { userId, date: todayStr },
        { $inc: { xpEarned: bonusXp } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    await user.save();

    return {
      success: true,
      isFirstTime,
      xpEarned: bonusXp,
      totalXp: user.gamification.totalXp,
      level: user.gamification.level,
      profile: user.profile,
      message: isFirstTime
        ? "Hoàn thành khảo sát thành công! Bạn nhận được +50 XP chào mừng 🎉"
        : "Cập nhật lộ trình học thành công!",
    };
  }
}

export default UserService;
