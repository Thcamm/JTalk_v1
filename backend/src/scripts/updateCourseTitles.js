import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";

dotenv.config({ path: "./backend/.env" });
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config();
}

async function updateCourseTitles() {
  try {
    const connStr = process.env.MONGODB_CONNECTIONSTRING;
    if (!connStr) {
      console.error("Không tìm thấy MONGODB_CONNECTIONSTRING");
      process.exit(1);
    }

    await mongoose.connect(connStr);
    console.log("Đã kết nối MongoDB thành công!");

    const courses = await Course.find();
    console.log(`Tìm thấy ${courses.length} khóa học/chủ đề trong cơ sở dữ liệu:`);

    for (const c of courses) {
      console.log(`- Trước khi cập nhật: [${c.level}] ${c.title} (channel: ${c.channelName}, cat: ${c.category})`);

      // 1. Course Sambon / Kính ngữ
      if (c.title.includes("Kính ngữ") || c.title.includes("Sambon")) {
        c.title = "Kính ngữ và Văn hóa Giao tiếp Chuẩn Nhật";
        c.description =
          "Tuyển tập video bài giảng Kính ngữ thực tế: Thể lịch sự, Tôn kính ngữ, Khiêm nhường ngữ và luyện phản xạ tự nhiên.";
        c.category = "Kính ngữ • Văn hóa ứng xử";
        c.tags = ["Kính ngữ", "Giao tiếp", "Phản xạ", "N4"];
        c.sourceType = "community";
        c.channelName = "三本塾 -Sambon Juku-";
        c.channelUrl = "https://www.youtube.com/@SambonJuku";
        c.isPremiumOnly = false;
      }
      // 2. Course N5
      else if (c.title.includes("Beginner") || (c.level === "N5" && !c.title.includes("Minna"))) {
        c.title = "Giao tiếp Nhập môn – Phản xạ Cơ bản N5";
        c.description =
          "Luyện tập phản xạ giao tiếp đời sống hàng ngày từ con số 0 đến N5 cùng trợ lý AI.";
        c.category = "Giao tiếp đời sống • Luyện nói phản xạ";
        c.tags = ["N5", "Chào hỏi", "Đời sống", "Luyện nói phản xạ"];
        c.sourceType = "jtalk";
        c.channelName = "JTalk AI Studio";
        c.isPremiumOnly = true;
      }
      // 3. Course N4
      else if (c.title.includes("Intermediate") || (c.level === "N4" && !c.title.includes("Kính ngữ"))) {
        c.title = "Giao tiếp Đời sống và Công sở N4";
        c.description =
          "Kịch bản giao tiếp đời sống mở rộng, gọi món nhà hàng, khám bệnh và phỏng vấn cơ bản.";
        c.category = "Công sở • Nhà hàng • Phỏng vấn";
        c.tags = ["N4", "Công sở", "Đời sống", "Phỏng vấn"];
        c.sourceType = "jtalk";
        c.channelName = "JTalk AI Studio";
        c.isPremiumOnly = true;
      }
      // 4. Course N3
      else if (c.title.includes("Business") || c.level === "N3") {
        c.title = "Tiếng Nhật Doanh nghiệp và Làm việc N3";
        c.description =
          "Kịch bản giao tiếp công sở chuyên sâu, quy tắc báo cáo HORENSO, trao đổi dự án và làm việc cùng đối tác.";
        c.category = "Công sở • Báo cáo công việc • Đàm phán";
        c.tags = ["N3", "Công sở", "Doanh nghiệp", "HORENSO"];
        c.sourceType = "jtalk";
        c.channelName = "JTalk AI Studio";
        c.isPremiumOnly = true;
      }
      // 5. Course Minna
      else if (c.title.includes("Minna")) {
        c.title = "Giáo trình Minna – 25 Tình huống Giao tiếp Thực tế";
        c.description =
          "Giáo trình sơ cấp 1: 25 bài video hội thoại, mỗi bài gồm Từ vựng, Ngữ pháp, Hội thoại, Hán tự và Luyện phản xạ tự nhiên.";
        c.category = "Tình huống thực tế • Ngữ pháp";
        c.tags = ["Giáo trình Minna", "N5", "Tình huống thực tế"];
        c.sourceType = "community";
        c.channelName = "Dũng Mori / Nihongo no Mori";
        c.channelUrl = "https://www.youtube.com/@dungmori";
        c.isPremiumOnly = false;
      } else {
        // Fallback cleanup
        c.title = c.title
          .replace(/\s*\([^)]*\)/g, "")
          .replace(/Kaiwa/gi, "Giao tiếp")
          .replace(/Beginner/gi, "Nhập môn")
          .replace(/Intermediate/gi, "Trung cấp")
          .replace(/Business Japanese/gi, "Tiếng Nhật Doanh nghiệp")
          .trim();
        if (c.category === "kaiwa") c.category = "Giao tiếp";
        if (c.category === "daily") c.category = "Đời sống";
        if (c.category === "business") c.category = "Công sở";
      }

      await c.save();
      console.log(`-> Sau khi cập nhật: [${c.level}] ${c.title} (source: ${c.sourceType}, lock: ${c.isPremiumOnly})`);
    }

    // Cập nhật các topics nếu có từ "kaiwa"
    const topics = await Topic.find();
    for (const t of topics) {
      let changed = false;
      if (t.name.includes("Kaiwa")) {
        t.name = t.name.replace(/Kaiwa/gi, "Giao tiếp");
        changed = true;
      }
      if (t.category === "kaiwa") {
        t.category = "Giao tiếp";
        changed = true;
      } else if (t.category === "daily") {
        t.category = "Đời sống";
        changed = true;
      } else if (t.category === "business") {
        t.category = "Công sở";
        changed = true;
      }
      if (changed) {
        await t.save();
      }
    }

    console.log("Đã cập nhật toàn bộ chủ đề và category sang tiếng Việt thành công!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("Lỗi khi cập nhật CSDL:", err);
    process.exit(1);
  }
}

updateCourseTitles();
