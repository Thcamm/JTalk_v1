import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";

dotenv.config();
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config({ path: "./backend/.env" });
}

const migrateSourceType = async () => {
  try {
    const connStr = process.env.MONGODB_CONNECTIONSTRING;
    if (!connStr) {
      console.log("Không có MONGODB_CONNECTIONSTRING, bỏ qua script migrate.");
      return;
    }

    await mongoose.connect(connStr);
    console.log("Đã kết nối MongoDB thành công...");

    // 1. Cập nhật Course
    const courses = await Course.find();
    console.log(`Kiểm tra ${courses.length} khóa học...`);
    for (const c of courses) {
      const isCommunity =
        c.courseType === "video_series" ||
        (c.channelName && !c.channelName.toLowerCase().includes("jtalk")) ||
        c.title.includes("Sambon") ||
        c.title.includes("Minna");

      c.sourceType = isCommunity ? "community" : "jtalk";
      if (isCommunity && !c.channelUrl) {
        if (c.channelName?.includes("Sambon")) {
          c.channelUrl = "https://www.youtube.com/@SambonJuku";
        } else if (c.channelName?.includes("Dũng Mori")) {
          c.channelUrl = "https://www.youtube.com/@dungmori";
        }
      }
      await c.save();
    }

    // 2. Cập nhật Lesson
    const lessons = await Lesson.find();
    console.log(`Kiểm tra ${lessons.length} bài học...`);
    for (const l of lessons) {
      const isCommunity =
        Boolean(l.youtubeId) ||
        l.lessonType === "video" ||
        (l.channelName && !l.channelName.toLowerCase().includes("jtalk"));

      l.sourceType = isCommunity ? "community" : "jtalk";
      if (isCommunity && !l.channelUrl && l.youtubeId) {
        l.channelUrl = `https://www.youtube.com/watch?v=${l.youtubeId}`;
      }
      await l.save();
    }

    console.log("Hoàn tất migrate sourceType cho Course và Lesson!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Lỗi trong quá trình migrate:", err);
  }
};

migrateSourceType();
