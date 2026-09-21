import Subscription from "../models/Subscription.js";
import Lesson from "../models/Lesson.js";
import Topic from "../models/Topic.js";
import { errorResponse } from "../utils/apiResponse.js";

/**
 * Checks if a given userId has an active, unexpired subscription
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{isPremium: boolean, subscription: any}>}
 */
export const checkUserPremiumSubscription = async (userId) => {
  if (!userId) {
    return { isPremium: false, subscription: null };
  }

  const now = new Date();
  const activeSub = await Subscription.findOne({
    userId,
    status: { $in: ["active", "ACTIVE"] },
    endDate: { $gt: now },
  }).sort({ endDate: -1 });

  return {
    isPremium: !!activeSub,
    subscription: activeSub,
  };
};

/**
 * Middleware: Strictly requires an active Premium subscription
 */
export const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, "Vui lòng đăng nhập để truy cập tính năng này.", 401);
    }

    const { isPremium, subscription } = await checkUserPremiumSubscription(req.user._id);

    if (!isPremium) {
      return errorResponse(
        res,
        "Tính năng này chỉ dành cho tài khoản Premium (99.000 VNĐ/tháng). Vui lòng nâng cấp gói để tiếp tục.",
        403,
        {
          requiresPremium: true,
          upgradeUrl: "/pricing",
        }
      );
    }

    req.isPremium = true;
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Lỗi trong requirePremium middleware:", error);
    return errorResponse(res, "Lỗi kiểm tra quyền Premium", 500);
  }
};

/**
 * Middleware: Checks if the requested Lesson or its parent Topic requires Premium
 */
export const checkLessonPremiumAccess = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    if (!lessonId) {
      return next();
    }

    const lesson = await Lesson.findById(lessonId).populate("topicId");
    if (!lesson) {
      return errorResponse(res, "Không tìm thấy bài học", 404);
    }

    const isLessonPremium = lesson.isPremiumOnly;
    const isTopicPremium = lesson.topicId?.isPremiumOnly;

    // If neither is premium, allow free access
    if (!isLessonPremium && !isTopicPremium) {
      req.lesson = lesson;
      return next();
    }

    // Requires Premium: user must be authenticated
    if (!req.user) {
      return errorResponse(
        res,
        "Bài học này thuộc nội dung Premium. Vui lòng đăng nhập và đăng ký gói Premium để học.",
        403,
        { requiresPremium: true }
      );
    }

    // Check if user has active subscription
    const { isPremium, subscription } = await checkUserPremiumSubscription(req.user._id);

    if (!isPremium) {
      return errorResponse(
        res,
        "Bài học này yêu cầu tài khoản Premium. Vui lòng nâng cấp gói để mở khóa toàn bộ hội thoại chuyên sâu.",
        403,
        {
          requiresPremium: true,
          lessonTitle: lesson.title,
          topicTitle: lesson.topicId?.name,
        }
      );
    }

    req.isPremium = true;
    req.subscription = subscription;
    req.lesson = lesson;
    next();
  } catch (error) {
    console.error("Lỗi trong checkLessonPremiumAccess middleware:", error);
    return errorResponse(res, "Lỗi kiểm tra quyền truy cập bài học", 500);
  }
};

/**
 * Middleware: Checks if the requested Topic requires Premium
 */
export const checkTopicPremiumAccess = async (req, res, next) => {
  try {
    const topicId = req.params.id;
    if (!topicId) {
      return next();
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return errorResponse(res, "Không tìm thấy chủ đề (Topic)", 404);
    }

    if (!topic.isPremiumOnly) {
      req.topic = topic;
      return next();
    }

    if (!req.user) {
      return errorResponse(
        res,
        "Chủ đề này thuộc nội dung Premium. Vui lòng đăng nhập tài khoản Premium.",
        403,
        { requiresPremium: true }
      );
    }

    const { isPremium, subscription } = await checkUserPremiumSubscription(req.user._id);

    if (!isPremium) {
      return errorResponse(
        res,
        "Chủ đề này yêu cầu tài khoản Premium. Vui lòng nâng cấp gói để tiếp tục.",
        403,
        { requiresPremium: true }
      );
    }

    req.isPremium = true;
    req.subscription = subscription;
    req.topic = topic;
    next();
  } catch (error) {
    console.error("Lỗi trong checkTopicPremiumAccess middleware:", error);
    return errorResponse(res, "Lỗi kiểm tra quyền chủ đề", 500);
  }
};
