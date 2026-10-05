import CurriculumService from "../services/curriculum.service.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/courses (or /api/courses)
 */
export const getCourses = async (req, res, next) => {
  try {
    const { level, category, sourceType } = req.query;
    const courses = await CurriculumService.getCourses({ level, category, sourceType });

    return res.status(200).json({
      success: true,
      data: courses,
      courses, // Direct access for frontend
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:id
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await CurriculumService.getCourseById(id);

    return res.status(200).json({
      success: true,
      data: course,
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:id/topics
 * Get list of topics belonging to a course
 */
export const getCourseTopics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { level } = req.query;

    const topics = await CurriculumService.getTopicsByCourseId(id, { level });

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
 * GET /api/v1/courses/:id/lessons
 * Get list of all lessons belonging to a course directly
 */
export const getCourseLessons = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lessons = await CurriculumService.getLessonsByCourseId(id);

    return res.status(200).json({
      success: true,
      data: lessons,
      lessons,
    });
  } catch (error) {
    next(error);
  }
};
