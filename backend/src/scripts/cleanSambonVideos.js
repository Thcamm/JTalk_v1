import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import Lesson from "../models/Lesson.js";

dotenv.config({ path: "./backend/.env" });
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config();
}

export async function cleanDuplicateSambonVideos() {
  console.log("🧹 Bắt đầu tiến trình kiểm tra và dọn dẹp các video Sambon Juku trùng lặp...");

  // 1. Tìm tất cả các bài học có youtubeId hoặc videoUrl chứa "1iDoq9sGX1s"
  const sambon1Lessons = await Lesson.find({
    $or: [
      { youtubeId: "1iDoq9sGX1s" },
      { videoUrl: { $regex: "1iDoq9sGX1s" } },
    ],
  });

  console.log(`🔍 Tìm thấy ${sambon1Lessons.length} bài học có liên kết video Sambon Juku (1iDoq9sGX1s).`);

  // Tìm khóa học Kính ngữ chuẩn của Sambon Juku
  const keigoCourse = await Course.findOne({
    $or: [
      { title: { $regex: "Kính ngữ|Sambon", $options: "i" } },
      { channelName: { $regex: "Sambon", $options: "i" } },
    ],
  });

  let restoredMinnaCount = 0;
  let deletedDuplicatesCount = 0;
  let cleanedAiKaiwaCount = 0;
  let originalSambonKept = false;

  for (const lesson of sambon1Lessons) {
    const title = lesson.title || "";
    const desc = lesson.description || "";
    const lessonIdStr = lesson._id.toString();

    // TRƯỜNG HỢP 1: Bài học Minna no Nihongo (bị ghi đè nhầm sang 1iDoq9sGX1s)
    const isMinna =
      title.includes("Minna") ||
      title.includes("初めまして") ||
      title.includes("第1課") ||
      title.includes("Bài 1") ||
      desc.includes("Minna") ||
      (lesson.courseId &&
        (await Course.findById(lesson.courseId).select("title").lean())?.title?.includes("Minna"));

    if (isMinna) {
      lesson.youtubeId = "nY9Hdf2Wcw4";
      lesson.videoUrl = "https://www.youtube.com/watch?v=nY9Hdf2Wcw4";
      lesson.channelName = "Dũng Mori / Nihongo Kaiwa";
      await lesson.save();
      restoredMinnaCount++;
      console.log(`✅ [Khôi phục Minna] Bài ${lessonIdStr} ("${title}") -> Trả về video nY9Hdf2Wcw4`);
      continue;
    }

    // TRƯỜNG HỢP 2: Bài học thuộc Kính ngữ Sambon Juku
    const isKeigo =
      (keigoCourse && lesson.courseId && lesson.courseId.toString() === keigoCourse._id.toString()) ||
      title.includes("敬語って何") ||
      title.includes("What is Japanese Keigo") ||
      title.includes("【敬語 1】");

    if (isKeigo) {
      if (!originalSambonKept) {
        // Giữ lại đúng 1 bài gốc chuẩn duy nhất cho Tập 1
        lesson.youtubeId = "1iDoq9sGX1s";
        lesson.videoUrl = "https://www.youtube.com/watch?v=1iDoq9sGX1s";
        lesson.channelName = "三本塾 -Sambon Juku-";
        lesson.channelUrl = "https://www.youtube.com/@SambonJuku";
        lesson.episodeNumber = 1;
        lesson.orderIndex = 1;
        await lesson.save();
        originalSambonKept = true;
        console.log(`⭐ [Giữ nguyên 1 bài chuẩn] Sambon Juku Tập 1 (${lessonIdStr}): "${title}"`);
      } else {
        // Các bài lặp lại Sambon Tập 1 khác -> XÓA BỎ
        await Lesson.deleteOne({ _id: lesson._id });
        deletedDuplicatesCount++;
        console.log(`🗑️ [Xóa bài trùng lặp] Đã xóa bài dư thừa (${lessonIdStr}): "${title}"`);
      }
      continue;
    }

    // TRƯỜNG HỢP 3: Bài học thuộc các khóa khác (AI Kaiwa N5, N4, N3) hoặc bài học rác
    if (lesson.lessonType === "dialogue" || !lesson.lessonType) {
      lesson.youtubeId = undefined;
      lesson.videoUrl = undefined;
      await lesson.save();
      cleanedAiKaiwaCount++;
      console.log(`🧹 [Gỡ link] Đã gỡ video Sambon khỏi bài AI Kaiwa (${lessonIdStr}): "${title}"`);
    } else {
      // Nếu là video rác bị lặp lại Sambon
      await Lesson.deleteOne({ _id: lesson._id });
      deletedDuplicatesCount++;
      console.log(`🗑️ [Xóa video dư thừa] Đã xóa bài nhân bản (${lessonIdStr}): "${title}"`);
    }
  }

  // 2. Kiểm tra xem có video nào bị duplicate trong cùng 1 Course không
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
        // Trùng lặp video trong cùng 1 khóa học -> Xóa bài trùng
        await Lesson.deleteOne({ _id: l._id });
        deletedDuplicatesCount++;
        console.log(`🗑️ [Xóa trùng trong khóa "${course.title}"] Đã xóa bài duplicate ID (${l._id}): yt=${yt}`);
      } else {
        seenYoutubeIds.add(yt);
      }
    }
  }

  // 3. Cập nhật lại số liệu thống kê chuẩn cho toàn bộ Courses
  console.log("\n📊 Cập nhật lại số liệu thống kê cho toàn bộ các khóa học/chủ đề...");
  for (const course of courses) {
    const currentLessons = await Lesson.find({
      $or: [
        { courseId: course._id },
        { topicId: { $in: (await Topic.find({ courseId: course._id }).select("_id")).map((t) => t._id) } },
      ],
    });

    const totalLessons = currentLessons.length;
    const totalVideos = currentLessons.filter((l) => l.youtubeId || l.videoUrl || l.lessonType === "video").length;
    const totalDurationMinutes = currentLessons.reduce((acc, curr) => acc + (curr.durationMinutes || 5), 0);

    course.totalLessons = totalLessons;
    course.totalVideos = totalVideos;
    course.totalDurationMinutes = totalDurationMinutes;
    await course.save();

    console.log(`- Khóa "${course.title}": ${totalLessons} bài học (${totalVideos} video), ${totalDurationMinutes} phút.`);
  }

  console.log("\n🎉 HOÀN TẤT DỌN DẸP DỮ LIỆU!");
  console.log(`- Đã khôi phục video Minna: ${restoredMinnaCount}`);
  console.log(`- Đã xóa bài trùng lặp dư thừa: ${deletedDuplicatesCount}`);
  console.log(`- Đã gỡ link khỏi bài AI Kaiwa: ${cleanedAiKaiwaCount}`);

  return {
    restoredMinnaCount,
    deletedDuplicatesCount,
    cleanedAiKaiwaCount,
  };
}

async function run() {
  try {
    const connStr = process.env.MONGODB_CONNECTIONSTRING;
    if (!connStr) {
      console.error("Không tìm thấy MONGODB_CONNECTIONSTRING");
      process.exit(1);
    }
    await mongoose.connect(connStr);
    console.log("Đã kết nối MongoDB thành công!");

    await cleanDuplicateSambonVideos();

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Lỗi khi chạy script dọn dẹp:", err);
    process.exit(1);
  }
}

// Chạy trực tiếp nếu gọi qua node command
if (process.argv[1]?.endsWith("cleanSambonVideos.js")) {
  run();
}
