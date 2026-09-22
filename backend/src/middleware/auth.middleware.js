import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/index.js";
import { errorResponse } from "../utils/apiResponse.js";

/**
 * Middleware strictly requiring a valid JWT Access Token
 */
export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) {
      return errorResponse(res, "Không tìm thấy Access Token. Vui lòng đăng nhập.", 401);
    }

    jwt.verify(token, config.jwt.accessTokenSecret, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return errorResponse(res, "Access Token đã hết hạn. Vui lòng làm mới token.", 401, {
            code: "TOKEN_EXPIRED",
          });
        }
        return errorResponse(res, "Access Token không hợp lệ.", 401, {
          code: "INVALID_TOKEN",
        });
      }

      const user = await User.findById(decoded.userId).select("-hashedPassword");

      if (!user) {
        return errorResponse(res, "Tài khoản người dùng không tồn tại.", 404);
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Lỗi trong auth.middleware:", error);
    return errorResponse(res, "Lỗi xác thực người dùng", 500);
  }
};

/**
 * Optional authentication: decodes user if token is present, but allows guest access if absent
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, config.jwt.accessTokenSecret, async (err, decoded) => {
      if (!err && decoded?.userId) {
        const user = await User.findById(decoded.userId).select("-hashedPassword");
        req.user = user || null;
      } else {
        req.user = null;
      }
      next();
    });
  } catch {
    req.user = null;
    next();
  }
};
