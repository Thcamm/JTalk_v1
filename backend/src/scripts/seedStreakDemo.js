import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import StudyLog from "../models/StudyLog.js";
import { formatDateToString, getYesterdayDateString } from "../utils/dateUtils.js";

dotenv.config();
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config({ path: "./backend/.env" });
}

export const setupStreakDemoAccount = async (targetUsername = null) => {
  try {
    const connStr = process.env.MONGODB_CONNECTIONSTRING;
    if (!connStr) {
      console.error("❌ Không tìm thấy MONGODB_CONNECTIONSTRING trong .env");
      process.exit(1);
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(connStr);
      console.log("✅ Đã kết nối CSDL MongoDB Atlas thành công.");
    }

    const salt = await bcrypt.genSalt(10);
    const demoPassword = "Password123@";
    const hashedPassword = await bcrypt.hash(demoPassword, salt);

    const usernameToUse = targetUsername ? targetUsername.trim().toLowerCase() : "demo_streak";
    const emailToUse = targetUsername ? `${usernameToUse}@jtalk.vn` : "demo_streak@jtalk.vn";

    let user = await User.findOne({
      $or: [{ username: usernameToUse }, { email: emailToUse }],
    });

    if (user) {
      console.log(`📌 Tìm thấy tài khoản: ${user.username} (${user.displayName || "Chưa đặt tên"}).`);
      // Update password to known demo password if requested, or keep existing
      if (!targetUsername) {
        user.hashedPassword = hashedPassword;
      }
      // Đồng bộ tên hiển thị sang tên người thuyết trình (Thiện Cẩm) nếu đang dùng tên mẫu cũ
      if (user.username === "demo_streak" && (!user.displayName || user.displayName === "Nguyễn Minh Nam")) {
        user.displayName = "Nguyễn Đức Thiện Cẩm";
        user.firstName = "Cẩm";
        user.lastName = "Nguyễn Đức Thiện";
      }
    } else {
      console.log(`✨ Chưa có tài khoản "${usernameToUse}", đang tạo tài khoản Demo mới...`);
      user = await User.create({
        username: usernameToUse,
        email: emailToUse,
        hashedPassword,
        displayName: "Nguyễn Đức Thiện Cẩm",
        firstName: "Cẩm",
        lastName: "Nguyễn Đức Thiện",
        role: "user",
        profile: {
          targetLevel: "N4",
          goal: "daily_conversation",
          occupation: "student",
          dailyTargetMinutes: 15,
        },
        subscription: {
          tier: "premium",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days premium
        },
      });
    }

    // 1. Tính toán ngày hiện tại và 6 ngày trước đó
    const now = new Date();
    const todayStr = formatDateToString(now);

    // XÓA sạch log của HÔM NAY để đảm bảo ngày thứ 7 CHƯA ĐIỂM DANH
    await StudyLog.deleteOne({ userId: user._id, date: todayStr });
    console.log(`🧹 Đã dọn dẹp điểm danh của ngày hôm nay (${todayStr}) -> Trạng thái: CHƯA ĐIỂM DANH`);

    // 2. Tạo lịch sử học tập chuẩn mực cho 6 ngày liên tiếp trước đó (từ hôm qua trở về trước)
    console.log("📅 Đang tạo chuỗi điểm danh 6 ngày liên tiếp trước đó:");
    for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - dayOffset);
      const pastDateStr = formatDateToString(pastDate);

      await StudyLog.findOneAndUpdate(
        { userId: user._id, date: pastDateStr },
        {
          $set: {
            checkedIn: true,
            minutesSpent: 15 + (dayOffset % 3) * 5,
            practiceCount: 2 + (dayOffset % 2),
            xpEarned: 30,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`   - Ngày -${dayOffset} (${pastDateStr}): Đã đóng dấu Hanko ✅ (+30 XP)`);
    }

    // 3. Đặt lastActiveDate là ngày HÔM QUA để ngày hôm nay tính tiếp thành 7 ngày liên tiếp!
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    yesterdayDate.setHours(20, 15, 0, 0); // 20:15 tối hôm qua

    user.gamification = {
      streak: 6,
      longestStreak: 6,
      lastActiveDate: yesterdayDate,
      totalXp: 180,
      level: 2,
      streakFreeze: {
        equipped: 1,
        lastUsedAt: null,
      },
    };

    user.dailyUsage = {
      date: formatDateToString(yesterdayDate),
      practiceCount: 0,
      minutesSpent: 0,
    };

    await user.save();

    console.log("\n=======================================================");
    console.log("🎉 TÀI KHOẢN ĐÃ SẴN SÀNG ĐỂ TRÌNH BÀY HỘI ĐỒNG: 🎉");
    console.log(`   - Tên đăng nhập (Username): ${user.username}`);
    console.log(`   - Mật khẩu (Password):      ${targetUsername ? "(Mật khẩu hiện tại của bạn)" : demoPassword}`);
    console.log(`   - Tên hiển thị:             ${user.displayName}`);
    console.log(`   - Chuỗi hiện tại (Streak):  6 ngày`);
    console.log(`   - Ngày cuối hoạt động:      Hôm qua (${formatDateToString(yesterdayDate)})`);
    console.log(`   - Hôm nay (${todayStr}):     Chưa điểm danh (Sẵn sàng kích hoạt ngày 7)`);
    console.log("=======================================================\n");

    return {
      success: true,
      user: {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        streak: 6,
        password: targetUsername ? "(Mật khẩu hiện tại)" : demoPassword,
      },
    };
  } catch (err) {
    console.error("❌ Lỗi cấu hình tài khoản Streak Demo:", err);
    throw err;
  }
};

// If run directly from terminal: `node backend/src/scripts/seedStreakDemo.js [username]`
if (process.argv[1] && process.argv[1].endsWith("seedStreakDemo.js")) {
  const argUser = process.argv[2] || null;
  setupStreakDemoAccount(argUser)
    .then(() => {
      console.log("✅ Hoàn tất thiết lập tài khoản demo.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
