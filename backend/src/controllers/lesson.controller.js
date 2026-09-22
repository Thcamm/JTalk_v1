import CurriculumService from "../services/curriculum.service.js";
import Lesson from "../models/Lesson.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

/**
 * GET /api/v1/lessons (or /api/lessons)
 */
export const getLessons = async (req, res, next) => {
  try {
    const { topicId, level } = req.query;
    const lessons = await CurriculumService.getAllLessons({ topicId, level });

    return res.status(200).json({
      success: true,
      data: lessons,
      lessons, // Direct access for frontend
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/lessons/:id
 * Fetches lesson details. Premium verification handled by checkLessonPremiumAccess middleware.
 */
export const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // req.lesson might already be attached by checkLessonPremiumAccess middleware
    const lesson = req.lesson || (await CurriculumService.getLessonById(id));

    return res.status(200).json({
      success: true,
      data: lesson,
      lesson, // Direct access for frontend
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/lessons
 */
export const createLesson = async (req, res, next) => {
  try {
    const {
      topicId,
      title,
      description,
      level,
      sampleSentence,
      translation,
      image,
      duration,
      durationMinutes,
      isPremiumOnly,
      isPublished,
      dialogues,
      vocabularyList,
    } = req.body;

    const sentenceToUse =
      sampleSentence || (dialogues && dialogues.length > 0 ? dialogues[0].japanese : "");

    if (!topicId || !title || !sentenceToUse) {
      return errorResponse(
        res,
        "Không thể thiếu topicId, title hoặc sampleSentence/dialogues",
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return errorResponse(res, "topicId không hợp lệ", 400);
    }

    const lesson = await Lesson.create({
      topicId,
      title,
      description: description || "",
      level: level || "N5",
      sampleSentence: sentenceToUse,
      translation:
        translation || (dialogues && dialogues.length > 0 ? dialogues[0].translation : ""),
      image: image || "",
      duration: duration || "10 phút",
      durationMinutes: durationMinutes || 10,
      isPremiumOnly: !!isPremiumOnly,
      isPublished: isPublished !== undefined ? isPublished : true,
      dialogues: dialogues || [],
      vocabularyList: vocabularyList || [],
    });

    return successResponse(res, lesson, "Tạo bài học thành công!", 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/lessons/:id
 */
export const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Lesson ID không hợp lệ.", 400);
    }

    const lesson = await Lesson.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    if (!lesson) {
      return errorResponse(res, "Không tìm thấy Bài học.", 404);
    }

    return successResponse(res, lesson, "Cập nhật Bài học thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/lessons/:id
 */
export const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Lesson ID không hợp lệ.", 400);
    }

    const lesson = await Lesson.findByIdAndDelete(id);
    if (!lesson) {
      return errorResponse(res, "Không tìm thấy Bài học.", 404);
    }

    return successResponse(res, null, "Xoá Bài học thành công!");
  } catch (error) {
    next(error);
  }
};
