import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Lesson from "../models/Lesson.js";
import mongoose from "mongoose";

function sanitizeCourseData(course) {
  if (!course) return course;
  const c = course.toObject ? course.toObject() : { ...course };
  let needsSave = false;
  const updates = {};

  // 1. Chuẩn hóa tiêu đề tiếng Việt, thân thiện với người mới, không gán nhãn cấp độ hàn lâm N5/N4/N3
  let cleanTitle = c.title || "";
  if (cleanTitle.includes("Kính ngữ") || cleanTitle.includes("Sambon")) {
    cleanTitle = "Kính ngữ và Văn hóa Giao tiếp Chuẩn Nhật";
  } else if (cleanTitle.includes("Beginner") || cleanTitle.includes("Nhập môn") || (c.level === "N5" && !cleanTitle.includes("Minna") && cleanTitle.includes("Kaiwa"))) {
    cleanTitle = "Giao tiếp Nhập môn – Phản xạ Cơ bản";
  } else if (cleanTitle.includes("Intermediate") || cleanTitle.includes("Đời sống") || (c.level === "N4" && !cleanTitle.includes("Kính ngữ") && cleanTitle.includes("Kaiwa"))) {
    cleanTitle = "Giao tiếp Đời sống và Tình huống Công sở";
  } else if (cleanTitle.includes("Business") || cleanTitle.includes("Doanh nghiệp") || (c.level === "N3" && (cleanTitle.includes("Đàm thoại") || cleanTitle.includes("HORENSO")))) {
    cleanTitle = "Tiếng Nhật Doanh nghiệp và Làm việc";
  } else if (cleanTitle.includes("Minna")) {
    cleanTitle = "Giáo trình Minna – 25 Tình huống Giao tiếp Thực tế";
  } else {
    cleanTitle = cleanTitle
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/Kaiwa/gi, "Giao tiếp")
      .replace(/Tokyo Accent/gi, "")
      .replace(/Beginner/gi, "Nhập môn")
      .replace(/Intermediate/gi, "Trung cấp")
      .replace(/Business Japanese/gi, "Tiếng Nhật Doanh nghiệp")
      .replace(/\s*N[1-5]\b/gi, "")
      .trim();
  }

  if (cleanTitle !== c.title) {
    updates.title = cleanTitle;
    c.title = cleanTitle;
    needsSave = true;
  }

  // 2. Chuẩn hóa Category sang tiếng Việt
  let cleanCat = c.category || "";
  if (cleanCat === "kaiwa") cleanCat = "Giao tiếp";
  else if (cleanCat === "daily") cleanCat = "Đời sống";
  else if (cleanCat === "business") cleanCat = "Công sở";
  else if (cleanCat.includes("Shadowing")) cleanCat = cleanCat.replace(/Shadowing/gi, "Phản xạ");

  if (cleanCat !== c.category) {
    updates.category = cleanCat;
    c.category = cleanCat;
    needsSave = true;
  }

  // 3. Chuẩn hóa Description: không dùng "Khóa học"
  if (c.description && c.description.includes("Khóa học")) {
    const cleanDesc = c.description.replace(/Khóa học/gi, "Chuỗi");
    updates.description = cleanDesc;
    c.description = cleanDesc;
    needsSave = true;
  }

  // 4. Nhận diện nguồn JTalk vs Community và thiết lập quyền Premium
  const isJTalk =
    (c.channelName && c.channelName.toLowerCase().includes("jtalk")) ||
    c.courseType === "ai_kaiwa" ||
    cleanTitle.includes("Nhập môn") ||
    cleanTitle.includes("Doanh nghiệp");

  const correctSourceType = isJTalk ? "jtalk" : "community";
  if (c.sourceType !== correctSourceType) {
    updates.sourceType = correctSourceType;
    c.sourceType = correctSourceType;
    needsSave = true;
  }

  if (isJTalk && !c.isPremiumOnly) {
    updates.isPremiumOnly = true;
    c.isPremiumOnly = true;
    needsSave = true;
  }

  // Tự động lưu ngầm xuống MongoDB để đồng bộ lâu dài
  if (needsSave && c._id) {
    Course.updateOne({ _id: c._id }, { $set: updates }).catch((e) =>
      console.warn("Lỗi cập nhật tự động Course:", e?.message)
    );
  }

  return c;
}

export class CurriculumService {
  /**
   * 1. Courses
   */
  static async getCourses({ level, category, sourceType } = {}) {
    const filter = { isPublished: true };

    if (level && level !== "Tất cả" && level !== "All") {
      filter.level = level;
    }

    if (category) {
      filter.category = category;
    }

    if (sourceType && sourceType !== "all" && sourceType !== "ALL") {
      filter.sourceType = sourceType;
    }

    const courses = await Course.find(filter).sort({ orderIndex: 1, createdAt: 1 });
    return courses.map(sanitizeCourseData);
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

    return sanitizeCourseData(course);
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

  /**
   * 2.1. Lessons by Course directly
   */
  static async getLessonsByCourseId(courseId, { isPublished = true } = {}) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const error = new Error("Course ID không hợp lệ.");
      error.statusCode = 400;
      throw error;
    }

    const filter = { courseId };
    if (isPublished) {
      filter.isPublished = true;
    }

    let lessons = await Lesson.find(filter)
      .populate("topicId", "name level orderIndex")
      .populate("courseId", "title level")
      .sort({ orderIndex: 1, createdAt: 1 });

    // Fallback nếu bài học chưa được migrate courseId trực tiếp
    if (!lessons || lessons.length === 0) {
      const topics = await Topic.find({ courseId }).select("_id");
      if (topics.length > 0) {
        const topicIds = topics.map((t) => t._id);
        const fallbackFilter = { topicId: { $in: topicIds } };
        if (isPublished) fallbackFilter.isPublished = true;
        lessons = await Lesson.find(fallbackFilter)
          .populate("topicId", "name level orderIndex")
          .populate("courseId", "title level")
          .sort({ orderIndex: 1, createdAt: 1 });
      }
    }

    // Tự động khử trùng lặp và khôi phục video chuẩn cho UI
    if (lessons && lessons.length > 0) {
      const seenYt = new Set();
      const uniqueLessons = [];
      const duplicateIdsToDelete = [];

      for (const l of lessons) {
        // Tự động khôi phục nếu Minna bị dính 1iDoq9sGX1s
        if (
          l.youtubeId === "1iDoq9sGX1s" &&
          (l.title?.includes("Minna") ||
            l.title?.includes("初めまして") ||
            l.title?.includes("第1課") ||
            (l.courseId && (l.courseId.title?.includes("Minna") || l.courseId.title?.includes("Dũng Mori"))))
        ) {
          l.youtubeId = "nY9Hdf2Wcw4";
          l.videoUrl = "https://www.youtube.com/watch?v=nY9Hdf2Wcw4";
          Lesson.updateOne(
            { _id: l._id },
            { $set: { youtubeId: "nY9Hdf2Wcw4", videoUrl: "https://www.youtube.com/watch?v=nY9Hdf2Wcw4" } }
          ).catch(() => {});
        }

        const yt = l.youtubeId?.trim();
        if (yt) {
          if (seenYt.has(yt)) {
            duplicateIdsToDelete.push(l._id);
            continue;
          }
          seenYt.add(yt);
        }
        uniqueLessons.push(l);
      }

      // Xóa các bản ghi trùng lặp ngầm trong cơ sở dữ liệu
      if (duplicateIdsToDelete.length > 0) {
        Lesson.deleteMany({ _id: { $in: duplicateIdsToDelete } }).catch((err) =>
          console.warn("Lỗi xóa bài học trùng lặp ngầm:", err?.message)
        );
      }
      lessons = uniqueLessons;
    }

    return lessons;
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

    return Lesson.find(filter).sort({ orderIndex: 1, createdAt: 1 });
  }

  static async getAllLessons({ topicId, courseId, level } = {}) {
    const filter = { isPublished: true };

    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        const error = new Error("courseId không hợp lệ.");
        error.statusCode = 400;
        throw error;
      }
      filter.courseId = courseId;
    }

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
      .populate("topicId", "name level isPremiumOnly orderIndex")
      .populate("courseId", "title level")
      .sort({ orderIndex: 1, createdAt: 1 });
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

  /**
   * 4. Auto Clean & Deduplicate Video Database
   */
  static async cleanDuplicateVideos() {
    try {
      console.log("🧹 Bắt đầu tiến trình tự động dọn dẹp các video trùng lặp...");

      const sambon1Lessons = await Lesson.find({
        $or: [
          { youtubeId: "1iDoq9sGX1s" },
          { videoUrl: { $regex: "1iDoq9sGX1s" } },
        ],
      });

      const keigoCourse = await Course.findOne({
        $or: [
          { title: { $regex: "Kính ngữ|Sambon", $options: "i" } },
          { channelName: { $regex: "Sambon", $options: "i" } },
        ],
      });

      let restoredMinnaCount = 0;
      let deletedDuplicatesCount = 0;
      let originalSambonKept = false;

      for (const lesson of sambon1Lessons) {
        const title = lesson.title || "";
        const desc = lesson.description || "";

        // Trường hợp Minna no Nihongo bị trỏ nhầm sang Sambon
        const isMinna =
          title.includes("Minna") ||
          title.includes("初めまして") ||
          title.includes("第1課") ||
          title.includes("Bài 1") ||
          desc.includes("Minna");

        if (isMinna) {
          lesson.youtubeId = "nY9Hdf2Wcw4";
          lesson.videoUrl = "https://www.youtube.com/watch?v=nY9Hdf2Wcw4";
          lesson.channelName = "Dũng Mori / Nihongo Kaiwa";
          await lesson.save();
          restoredMinnaCount++;
          continue;
        }

        // Trường hợp Sambon Keigo
        const isKeigo =
          (keigoCourse && lesson.courseId && lesson.courseId.toString() === keigoCourse._id.toString()) ||
          title.includes("敬語って何") ||
          title.includes("What is Japanese Keigo") ||
          title.includes("【敬語 1】");

        if (isKeigo) {
          if (!originalSambonKept) {
            lesson.youtubeId = "1iDoq9sGX1s";
            lesson.videoUrl = "https://www.youtube.com/watch?v=1iDoq9sGX1s";
            lesson.channelName = "三本塾 -Sambon Juku-";
            await lesson.save();
            originalSambonKept = true;
          } else {
            await Lesson.deleteOne({ _id: lesson._id });
            deletedDuplicatesCount++;
          }
          continue;
        }

        // Bài học thuộc khóa khác
        if (lesson.lessonType === "dialogue" || !lesson.lessonType) {
          lesson.youtubeId = undefined;
          lesson.videoUrl = undefined;
          await lesson.save();
        } else {
          await Lesson.deleteOne({ _id: lesson._id });
          deletedDuplicatesCount++;
        }
      }

      // Khử trùng lặp video trong cùng 1 khóa học
      const courses = await Course.find();
      for (const course of courses) {
        const lessonsInCourse = await Lesson.find({
          $or: [
            { courseId: course._id },
            { topicId: { $in: (await Topic.find({ courseId: course._id }).select("_id")).map((t) => t._id) } },
          ],
        }).sort({ orderIndex: 1, createdAt: 1 });

        const seenYoutubeIds = new Set();
        for (const l of lessonsInCourse) {
          const yt = l.youtubeId?.trim();
          if (!yt) continue;
          if (seenYoutubeIds.has(yt)) {
            await Lesson.deleteOne({ _id: l._id });
            deletedDuplicatesCount++;
          } else {
            seenYoutubeIds.add(yt);
          }
        }

        // Cập nhật lại số liệu thống kê
        const currentLessons = await Lesson.find({
          $or: [
            { courseId: course._id },
            { topicId: { $in: (await Topic.find({ courseId: course._id }).select("_id")).map((t) => t._id) } },
          ],
        });
        course.totalLessons = currentLessons.length;
        course.totalVideos = currentLessons.filter((l) => l.youtubeId || l.videoUrl || l.lessonType === "video").length;
        course.totalDurationMinutes = currentLessons.reduce((acc, curr) => acc + (curr.durationMinutes || 5), 0);
        await course.save();
      }

      console.log(`✅ [CurriculumService] Hoàn tất dọn dẹp: Khôi phục Minna: ${restoredMinnaCount}, Xóa video trùng: ${deletedDuplicatesCount}`);
      return { restoredMinnaCount, deletedDuplicatesCount };
    } catch (err) {
      console.warn("Lỗi khi tự động dọn dẹp video:", err?.message);
      return { error: err.message };
    }
  }
}

export default CurriculumService;
