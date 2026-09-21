import AuthService from "../services/auth.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";

const cookieOptions = {
  httpOnly: true,
  secure: config.env === "production",
  sameSite: config.env === "production" ? "none" : "lax",
  maxAge: config.jwt.refreshTokenTtlMs,
};

/**
 * POST /api/v1/auth/register (or /api/auth/signup)
 */
export const register = async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName, displayName } = req.body;

    if (!username || !password || !email) {
      return errorResponse(res, "Vui lòng cung cấp username, password và email.", 400);
    }

    const newUser = await AuthService.register({
      username,
      password,
      email,
      firstName,
      lastName,
      displayName,
    });

    return successResponse(res, newUser, "Đăng ký tài khoản thành công!", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login (or /api/auth/signin)
 */
export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, "Vui lòng nhập tên đăng nhập và mật khẩu.", 400);
    }

    const { user, accessToken, refreshToken } = await AuthService.login({
      username,
      password,
    });

    // Set secure HTTP-only cookie with refreshToken
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return successResponse(
      res,
      {
        user,
        accessToken,
      },
      `Chào mừng ${user.displayName} quay trở lại!`,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return errorResponse(res, "Không tìm thấy Refresh Token.", 401);
    }

    const { accessToken, user } = await AuthService.refreshAccessToken(token);

    return successResponse(
      res,
      {
        accessToken,
        user,
      },
      "Cấp mới Access Token thành công!",
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout (or /api/auth/signout)
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (token) {
      await AuthService.logout(token);
      res.clearCookie("refreshToken", cookieOptions);
    }

    return successResponse(res, null, "Đăng xuất thành công!", 200);
  } catch (error) {
    next(error);
  }
};

// Aliases for backward compatibility with frontend
export const signUp = register;
export const signIn = login;
export const signOut = logout;
export const refreshToken = refresh;
