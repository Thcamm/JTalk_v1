import { errorResponse } from "../utils/apiResponse.js";
import config from "../config/index.js";

export const errorHandler = (err, _req, res, _next) => {
  console.error("Unhandler error caught by middleware:", err);

  // Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "trường dữ liệu";
    return errorResponse(res, `Giá trị của '${field}' đã tồn tại trong hệ thống.`, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    return errorResponse(res, "Dữ liệu gửi lên không hợp lệ.", 400, errors);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return errorResponse(res, `Định dạng ID không hợp lệ cho trường '${err.path}'.`, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Token xác thực không hợp lệ.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token xác thực đã hết hạn.", 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Lỗi máy chủ nội bộ";

  return errorResponse(
    res,
    message,
    statusCode,
    config.env === "development" ? { stack: err.stack } : null
  );
};
