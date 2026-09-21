/**
 * Standardized API Response utilities for JTalk Backend
 */

export const successResponse = (res, data = {}, message = "Thành công", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const errorResponse = (res, message = "Lỗi hệ thống", statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const paginatedResponse = (
  res,
  items = [],
  total = 0,
  page = 1,
  limit = 10,
  message = "Thành công"
) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNext: Number(page) < totalPages,
      hasPrev: Number(page) > 1,
    },
    timestamp: new Date().toISOString(),
  });
};
