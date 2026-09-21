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

// Aliases for compatibility
export const authMe = getMe;
