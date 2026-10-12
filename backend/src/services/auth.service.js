import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Session from "../models/Session.js";
import config from "../config/index.js";

/**
 * Service for user authentication and session management
 */
export class AuthService {
  /**
   * Register a new user account
   */
  static async register({ username, password, email, firstName, lastName, displayName }) {
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate username & email in a single optimized DB round-trip
    const existing = await User.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
    }).lean();

    if (existing) {
      if (existing.username === trimmedUsername) {
        const error = new Error("Tên đăng nhập đã được sử dụng.");
        error.statusCode = 409;
        throw error;
      }
      const error = new Error("Email đã được đăng ký tài khoản khác.");
      error.statusCode = 409;
      throw error;
    }

    // Hash password with bcrypt (salt = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vietnamese name convention: Họ (lastName) + Tên (firstName)
    const vietnameseFullName = `${lastName || ""} ${firstName || ""}`.trim();
    const westernFullName = `${firstName || ""} ${lastName || ""}`.trim();
    const resolvedDisplayName =
      (displayName && displayName.trim()) ||
      vietnameseFullName ||
      westernFullName ||
      trimmedUsername;

    const user = await User.create({
      username: trimmedUsername,
      hashedPassword,
      email: trimmedEmail,
      displayName: resolvedDisplayName,
    });

    // Auto generate session & tokens for instant seamless login
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwt.accessTokenSecret,
      { expiresIn: config.jwt.accessTokenTtl }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + config.jwt.refreshTokenTtlMs);
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt,
    });

    const userObj = user.toObject();
    delete userObj.hashedPassword;

    return {
      user: userObj,
      accessToken,
      refreshToken,
      userId: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
    };
  }

  /**
   * Sign in with username and password
   */
  static async login({ username, password }) {
    const trimmedUsername = username.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedUsername }],
    });

    if (!user) {
      const error = new Error("Tên đăng nhập hoặc mật khẩu không chính xác.");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      const error = new Error("Tên đăng nhập hoặc mật khẩu không chính xác.");
      error.statusCode = 401;
      throw error;
    }

    // Ensure displayName is always populated with at least username if empty
    if (!user.displayName || !user.displayName.trim()) {
      user.displayName = user.username;
      await user.save();
    }

    // Generate short-lived Access Token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwt.accessTokenSecret,
      { expiresIn: config.jwt.accessTokenTtl }
    );

    // Generate secure random Refresh Token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Persist Refresh Token in sessions collection
    const expiresAt = new Date(Date.now() + config.jwt.refreshTokenTtlMs);
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt,
    });

    const userObj = user.toObject();
    delete userObj.hashedPassword;

    return {
      user: userObj,
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Refresh access token using a valid session
   */
  static async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error("Không tìm thấy Refresh Token.");
      error.statusCode = 401;
      throw error;
    }

    // Find token in sessions collection
    const session = await Session.findOne({ refreshToken }).populate("userId", "-hashedPassword");

    if (!session) {
      const error = new Error("Refresh Token không hợp lệ hoặc đã bị thu hồi.");
      error.statusCode = 403;
      throw error;
    }

    // Check expiry
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      const error = new Error("Refresh Token đã hết hạn. Vui lòng đăng nhập lại.");
      error.statusCode = 403;
      throw error;
    }

    const user = session.userId;
    if (!user) {
      const error = new Error("Người dùng của phiên đăng nhập không tồn tại.");
      error.statusCode = 404;
      throw error;
    }

    // Issue new Access Token
    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwt.accessTokenSecret,
      { expiresIn: config.jwt.accessTokenTtl }
    );

    return {
      accessToken: newAccessToken,
      user,
    };
  }

  /**
   * Log out and destroy session
   */
  static async logout(refreshToken) {
    if (!refreshToken) return true;

    await Session.deleteOne({ refreshToken });
    return true;
  }

  /**
   * Request password reset token / OTP
   */
  static async forgotPassword({ emailOrUsername }) {
    const trimmed = (emailOrUsername || "").trim().toLowerCase();
    if (!trimmed) {
      const error = new Error("Vui lòng cung cấp email hoặc tên đăng nhập.");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({
      $or: [{ username: trimmed }, { email: trimmed }],
    });

    if (!user) {
      const error = new Error("Không tìm thấy tài khoản với thông tin đã cung cấp.");
      error.statusCode = 404;
      throw error;
    }

    // Generate 6-digit verification code (valid for 15 mins)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return {
      message: "Mã xác thực đặt lại mật khẩu đã được tạo thành công.",
      email: user.email,
      resetCode, // Returned for instant testing and local dev ease
    };
  }

  /**
   * Confirm password reset with OTP
   */
  static async resetPassword({ emailOrUsername, resetCode, newPassword }) {
    const trimmed = (emailOrUsername || "").trim().toLowerCase();
    if (!trimmed || !resetCode || !newPassword) {
      const error = new Error("Vui lòng điền đầy đủ email/username, mã xác nhận và mật khẩu mới.");
      error.statusCode = 400;
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({
      $or: [{ username: trimmed }, { email: trimmed }],
    });

    if (!user) {
      const error = new Error("Không tìm thấy tài khoản.");
      error.statusCode = 404;
      throw error;
    }

    if (
      !user.resetPasswordToken ||
      user.resetPasswordToken !== resetCode.trim() ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      const error = new Error("Mã xác thực không đúng hoặc đã hết hạn (15 phút).");
      error.statusCode = 400;
      throw error;
    }

    user.hashedPassword = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return {
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.",
    };
  }
}

export default AuthService;
