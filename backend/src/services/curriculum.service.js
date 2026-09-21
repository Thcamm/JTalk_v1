import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Lesson from "../models/Lesson.js";
import mongoose from "mongoose";

export class CurriculumService {
  /**
   * 1. Courses
   */
  static async getCourses({ level, category } = {}) {
    const filter = { isPublished: true };

    if (level && level !== "Tất cả" && level !== "All") {
      filter.level = level;
    }

    if (category) {
      filter.category = category;
    }

    return Course.find(filter).sort({ orderIndex: 1, createdAt: 1 });
  }

  static async getCourseById(courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error("Course ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error("Không tìm thấy khóa học.");
      error.statusCode = 404;
      throw error;
    }

    return course;
  }

  /**
   * 2. Topics by Course
   */
  static async getTopicsByCourseId(courseId, { level } = {}) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error("Course ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const filter = { courseId, isPublished: true };
    if (level && level !== "Tất cả") {
      filter.level = level;
    }

    return Topic.find(filter).sort({ orderIndex: 1, createdAt: 1 });
  }

  static async getAllTopics({ level, category } = {}) {
    const filter = { isPublished: true };
    if (level && level !== "Tất cả") {
      filter.level = level;
    }
    if (category) {
      filter.category = category;
    }

    return Topic.find(filter)
      .populate("courseId", "title level")
      .sort({ orderIndex: 1, createdAt: 1 });
  }

  static async getTopicById(topicId) {
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      const error = new Error("Topic ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const topic = await Topic.findById(topicId).populate("courseId", "title level");
    if (!topic) {
      const error = new Error("Không tìm thấy chủ đề (Topic).");
      error.statusCode = 404;
      throw error;
    }

    return topic;
  }

  /**
   * 3. Lessons by Topic
   */
  static async getLessonsByTopicId(topicId, { level } = {}) {
    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      const error = new Error("Topic ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const filter = { topicId, isPublished: true };
    if (level && level !== "Tất cả") {
      filter.level = level;
    }

    return Lesson.find(filter).sort({ createdAt: 1 });
  }

  static async getAllLessons({ topicId, level } = {}) {
    const filter = { isPublished: true };

    if (topicId) {
      if (!mongoose.Types.ObjectId.isValid(topicId)) {
        const error = new Error("topicId không hợp lệ.");
        error.statusCode = 400;
        throw error;
      }
      filter.topicId = topicId;
    }

    if (level && level !== "Tất cả") {
      filter.level = level;
    }

    return Lesson.find(filter)
      .populate("topicId", "name level isPremiumOnly")
      .sort({ createdAt: 1 });
  }

  static async getLessonById(lessonId) {
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      const error = new Error("Lesson ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const lesson = await Lesson.findById(lessonId).populate("topicId", "name level isPremiumOnly courseId");
    if (!lesson) {
      const error = new Error("Không tìm thấy bài học (Lesson).");
      error.statusCode = 404;
      throw error;
    }

    return lesson;
  }
}

export default CurriculumService;
