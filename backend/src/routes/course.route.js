import express from "express";
import {
  getCourses,
  getCourseById,
  getCourseTopics,
} from "../controllers/course.controller.js";

const router = express.Router();

// GET /api/v1/courses: Lấy danh sách khóa học
router.get("/", getCourses);

// GET /api/v1/courses/:id: Lấy chi tiết khóa học
router.get("/:id", getCourseById);

// GET /api/v1/courses/:id/topics: Lấy danh sách topics thuộc khóa học
router.get("/:id/topics", getCourseTopics);

export default router;
