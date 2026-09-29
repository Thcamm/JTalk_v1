import UserService from "../services/user.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/users/me (or /api/users/me)
 * Retrieves user profile, active subscription details from subscriptions collection, and streak
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userData = await UserService.getMe(userId);

    // Provide both user object format and wrapped format for full compatibility
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin người dùng thành công!",
      data: userData,
      user: userData, // For frontend compatibility (res.data.user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updatedUser = await UserService.updateProfile(userId, req.body);

    return successResponse(res, updatedUser, "Cập nhật thông tin thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/leaderboard
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const type = req.query.type || "xp"; // "xp" | "streak"
    const limit = parseInt(req.query.limit, 10) || 20;
    const leaderboard = await UserService.getLeaderboard(type, limit);

    return successResponse(res, leaderboard, "Lấy bảng xếp hạng thành công!");
  } catch (error) {
    next(error);
  }
};

// Aliases for compatibility
export const authMe = getMe;
