import CurriculumService from "../services/curriculum.service.js";
import Topic from "../models/Topic.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

/**
 * GET /api/v1/topics (or /api/topics)
 */
export const getTopics = async (req, res, next) => {
  try {
    const { level, category } = req.query;
    const topics = await CurriculumService.getAllTopics({ level, category });

    return res.status(200).json({
      success: true,
      data: topics,
      topics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/topics/:id
 */
export const getTopicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const topic = req.topic || (await CurriculumService.getTopicById(id));

    return res.status(200).json({
      success: true,
      data: topic,
      topic,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/topics/:id/lessons (or /api/topics/:id/lessons)
 * Retrieves lessons belonging to this topic
 */
export const getTopicLessons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { level } = req.query;

    const lessons = await CurriculumService.getLessonsByTopicId(id, { level });

    return res.status(200).json({
      success: true,
      data: lessons,
      lessons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/topics
 */
export const createTopic = async (req, res, next) => {
  try {
    const { courseId, name, description, level, image, isPremiumOnly, isPublished, orderIndex } = req.body;

    if (!name) {
      return errorResponse(res, "Tên chủ đề (name) là bắt buộc.", 400);
    }

    const topic = await Topic.create({
      courseId: courseId || null,
      name,
      description: description || "",
      level: level || "N5",
      image: image || "",
      isPremiumOnly: !!isPremiumOnly,
      isPublished: isPublished !== undefined ? isPublished : true,
      orderIndex: orderIndex || 0,
    });

    return successResponse(res, topic, "Tạo chủ đề thành công!", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/topics/:id
 */
export const updateTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Topic ID không hợp lệ.", 400);
    }

    const topic = await Topic.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!topic) {
      return errorResponse(res, "Không tìm thấy Topic.", 404);
    }

    return successResponse(res, topic, "Cập nhật chủ đề thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/topics/:id
 */
export const deleteTopic = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Topic ID không hợp lệ.", 400);
    }

    const topic = await Topic.findByIdAndDelete(id);
    if (!topic) {
      return errorResponse(res, "Không tìm thấy Topic.", 404);
    }

    return successResponse(res, null, "Xoá chủ đề thành công!");
  } catch (error) {
    next(error);
  }
};
