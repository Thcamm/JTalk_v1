import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Lesson from "../models/Lesson.js";

dotenv.config();
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config({ path: "./backend/.env" });
}

const migrate = async () => {
  try {
    const connStr = process.env.MONGODB_CONNECTIONSTRING;
    if (!connStr) {
      console.error("LỖI: MONGODB_CONNECTIONSTRING chưa được cấu hình trong .env");
      process.exit(1);
    }

    await mongoose.connect(connStr);
    console.log("Đã kết nối MongoDB thành công để chạy Migration...");

    // 1. Quét toàn bộ Lesson
    const lessons = await Lesson.find();
    console.log(`Tìm thấy ${lessons.length} bài học cần kiểm tra.`);

    let updatedLessons = 0;
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      let needsSave = false;

      // Cập nhật courseId từ topicId nếu thiếu
      if (!lesson.courseId && lesson.topicId) {
        const topic = await Topic.findById(lesson.topicId).select("courseId");
        if (topic && topic.courseId) {
          lesson.courseId = topic.courseId;
          needsSave = true;
        }
      }

      // Đặt orderIndex nếu chưa có
      if (lesson.orderIndex === undefined || lesson.orderIndex === null) {
        lesson.orderIndex = i + 1;
        needsSave = true;
      }

      // Đặt episodeNumber nếu chưa có
      if (lesson.episodeNumber === undefined || lesson.episodeNumber === null) {
        lesson.episodeNumber = lesson.orderIndex || (i + 1);
        needsSave = true;
      }

      // Đặt lessonType
      if (!lesson.lessonType) {
        lesson.lessonType = lesson.youtubeId || lesson.videoUrl ? "video" : "dialogue";
        needsSave = true;
      }

      if (needsSave) {
        await lesson.save();
        updatedLessons++;
      }
    }
    console.log(`Đã chuẩn hóa và gán courseId cho ${updatedLessons} bài học.`);

    // 2. Cập nhật thống kê số lượng video & thời lượng cho từng khóa học
    const courses = await Course.find();
    console.log(`Cập nhật thống kê cho ${courses.length} khóa học...`);

    for (const course of courses) {
      const courseLessons = await Lesson.find({
        $or: [
          { courseId: course._id },
          { topicId: { $in: (await Topic.find({ courseId: course._id }).select("_id")).map((t) => t._id) } },
        ],
      });

      const totalLessons = courseLessons.length;
      const totalVideos = courseLessons.filter((l) => l.youtubeId || l.videoUrl || l.lessonType === "video").length;
      const totalDurationMinutes = courseLessons.reduce((acc, curr) => acc + (curr.durationMinutes || 5), 0);

      course.totalLessons = totalLessons;
      course.totalVideos = totalVideos;
      course.totalDurationMinutes = totalDurationMinutes;
      if (!course.courseType) {
        course.courseType = totalVideos > 0 ? "video_series" : "ai_kaiwa";
      }

      await course.save();
      console.log(`- Khóa "${course.title}": ${totalLessons} bài (${totalVideos} video), ${totalDurationMinutes} phút.`);
    }

    console.log("Migration hoàn tất thành công 100%!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi chạy migration:", error);
    process.exit(1);
  }
};

migrate();
