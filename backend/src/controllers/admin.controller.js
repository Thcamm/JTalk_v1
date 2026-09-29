import User from "../models/User.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Lesson from "../models/Lesson.js";
import Practice from "../models/Practice.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

/**
 * GET /api/v1/admin/stats
 * Overview dashboard KPIs
 */
export const getStats = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalPremiumUsers,
      totalCourses,
      totalTopics,
      totalLessons,
      totalVideoLessons,
      totalPractices,
      recentUsers,
      recentLessons,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ "subscription.tier": "premium" }),
      Course.countDocuments(),
      Topic.countDocuments(),
      Lesson.countDocuments(),
      Lesson.countDocuments({
        $or: [
          { youtubeId: { $exists: true, $ne: "" } },
          { videoUrl: { $exists: true, $ne: "" } },
        ],
      }),
      Practice.countDocuments(),
      User.find()
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Lesson.find()
        .select("title level youtubeId isPublished duration createdAt topicId")
        .populate("topicId", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return successResponse(res, {
      kpi: {
        totalUsers,
        totalAdmins,
        totalPremiumUsers,
        totalCourses,
        totalTopics,
        totalLessons,
        totalVideoLessons,
        totalPractices,
      },
      recentUsers,
      recentLessons,
    }, "Lấy số liệu thống kê thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 * Paginated user list with filters & search
 */
export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { search, role, tier, level } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { username: regex },
        { email: regex },
        { displayName: regex },
      ];
    }

    if (role && ["user", "admin"].includes(role)) {
      filter.role = role;
    }

    if (tier && ["free", "premium"].includes(tier)) {
      filter["subscription.tier"] = tier;
    }

    if (level && ["N5", "N4", "N3", "N2", "N1"].includes(level)) {
      filter["profile.targetLevel"] = level;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-hashedPassword")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return successResponse(res, {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, "Lấy danh sách người dùng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/role
 * Update user role (user <-> admin)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "User ID không hợp lệ.", 400);
    }

    if (!["user", "admin"].includes(role)) {
      return errorResponse(res, "Vai trò không hợp lệ (phải là 'user' hoặc 'admin').", 400);
    }

    // Prevent demoting oneself
    if (id === req.user._id.toString() && role !== "admin") {
      return errorResponse(res, "Bạn không thể tự hạ quyền quản trị viên của chính mình.", 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    ).select("-hashedPassword");

    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng.", 404);
    }

    return successResponse(res, user, `Đã cập nhật vai trò người dùng thành '${role}'!`);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/subscription
 * Grant or revoke Premium access
 */
export const updateUserSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tier, durationDays } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "User ID không hợp lệ.", 400);
    }

    if (!["free", "premium"].includes(tier)) {
      return errorResponse(res, "Gói học không hợp lệ (phải là 'free' hoặc 'premium').", 400);
    }

    const updateData = {
      "subscription.tier": tier,
    };

    if (tier === "premium") {
      const days = parseInt(durationDays) || 30;
      updateData["subscription.expiresAt"] = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      updateData["subscription.expiresAt"] = null;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select("-hashedPassword");

    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng.", 404);
    }

    return successResponse(res, user, "Đã cập nhật gói học của người dùng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/users/:id
 * Delete user account
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "User ID không hợp lệ.", 400);
    }

    if (id === req.user._id.toString()) {
      return errorResponse(res, "Bạn không thể tự xóa tài khoản của chính mình.", 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, "Không tìm thấy người dùng để xoá.", 404);
    }

    return successResponse(res, null, "Xoá tài khoản người dùng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/lessons
 * Full lesson management list with populate & filters
 */
export const getAdminLessons = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const { search, topicId, level, isPublished, hasVideo } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { channelName: regex },
      ];
    }

    if (topicId && mongoose.Types.ObjectId.isValid(topicId)) {
      filter.topicId = topicId;
    }

    if (level && ["N5", "N4", "N3", "N2", "N1"].includes(level)) {
      filter.level = level;
    }

    if (isPublished !== undefined && isPublished !== "") {
      filter.isPublished = isPublished === "true" || isPublished === true;
    }

    if (hasVideo === "true") {
      filter.$or = [
        { youtubeId: { $exists: true, $ne: "" } },
        { videoUrl: { $exists: true, $ne: "" } },
      ];
    }

    const [lessons, total] = await Promise.all([
      Lesson.find(filter)
        .populate({
          path: "topicId",
          select: "name courseId",
          populate: { path: "courseId", select: "title" },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lesson.countDocuments(filter),
    ]);

    return successResponse(res, {
      lessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, "Lấy danh sách bài học quản trị thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/courses
 * Course list with topics count
 */
export const getAdminCourses = async (_req, res, next) => {
  try {
    const courses = await Course.find().sort({ orderIndex: 1, createdAt: -1 }).lean();
    return successResponse(res, courses, "Lấy danh sách khóa học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/courses
 * Create course
 */
export const createAdminCourse = async (req, res, next) => {
  try {
    const { title, description, level, thumbnail, category, channelName, isPublished, isPremiumOnly, orderIndex } = req.body;

    if (!title) {
      return errorResponse(res, "Tiêu đề khóa học là bắt buộc.", 400);
    }

    const course = await Course.create({
      title,
      description: description || "",
      level: level || "N5",
      thumbnail: thumbnail || "",
      category: category || "kaiwa",
      channelName: channelName || "",
      isPublished: isPublished !== undefined ? isPublished : true,
      isPremiumOnly: !!isPremiumOnly,
      orderIndex: orderIndex || 0,
    });

    return successResponse(res, course, "Tạo khóa học thành công!", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/courses/:id
 * Update course
 */
export const updateAdminCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Course ID không hợp lệ.", 400);
    }

    const course = await Course.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!course) {
      return errorResponse(res, "Không tìm thấy khóa học.", 404);
    }

    return successResponse(res, course, "Cập nhật khóa học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/courses/:id
 * Delete course
 */
export const deleteAdminCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Course ID không hợp lệ.", 400);
    }

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return errorResponse(res, "Không tìm thấy khóa học.", 404);
    }

    return successResponse(res, null, "Xoá khóa học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/topics
 * Get topics with optional courseId filter
 */
export const getAdminTopics = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const filter = {};
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }

    const topics = await Topic.find(filter)
      .populate("courseId", "title")
      .sort({ orderIndex: 1, createdAt: -1 })
      .lean();

    return successResponse(res, topics, "Lấy danh sách chủ đề thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/topics
 * Create topic
 */
export const createAdminTopic = async (req, res, next) => {
  try {
    const { courseId, name, description, level, image, category, isPremiumOnly, isPublished, orderIndex } = req.body;

    if (!name) {
      return errorResponse(res, "Tên chủ đề là bắt buộc.", 400);
    }

    const topic = await Topic.create({
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined,
      name,
      description: description || "",
      level: level || "N5",
      image: image || "",
      category: category || "daily",
      isPremiumOnly: !!isPremiumOnly,
      isPublished: isPublished !== undefined ? isPublished : true,
      orderIndex: orderIndex || 0,
    });

    return successResponse(res, topic, "Tạo chủ đề thành công!", 201);
  } catch (error) {
    next(error);
  }
};
