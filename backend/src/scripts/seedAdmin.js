import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";

dotenv.config();
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config({ path: "./backend/.env" });
}

const promoteOrCreateAdmin = async () => {
  try {
    const connStr = process.env.MONGODB_CONNECTIONSTRING;
    if (!connStr) {
      console.error("❌ Không tìm thấy MONGODB_CONNECTIONSTRING trong .env");
      process.exit(1);
    }

    await mongoose.connect(connStr);
    console.log("✅ Đã kết nối CSDL MongoDB Atlas thành công.");

    const salt = await bcrypt.genSalt(10);
    const targetPassword = "12345678";
    const hashedPassword = await bcrypt.hash(targetPassword, salt);

    // Look for user "admin" by username or email
    let admin = await User.findOne({
      $or: [{ username: "admin" }, { email: "admin@jtalk.vn" }],
    });

    if (admin) {
      admin.role = "admin";
      admin.hashedPassword = hashedPassword;
      admin.displayName = admin.displayName || "JTalk Administrator";
      admin.subscription = {
        tier: "free",
        expiresAt: null,
      };
      await admin.save();
      console.log("🎉 ĐÃ CẬP NHẬT TÀI KHOẢN QUẢN TRỊ VIÊN THÀNH CÔNG:");
      console.log(`   - Username: ${admin.username}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Mật khẩu mới: ${targetPassword}`);
      console.log(`   - Vai trò: ${admin.role} (Toàn quyền hệ thống, không cần gói subscription)`);
    } else {
      admin = await User.create({
        username: "admin",
        email: "admin@jtalk.vn",
        hashedPassword,
        displayName: "JTalk Administrator",
        role: "admin",
        profile: {
          targetLevel: "N1",
          goal: "business",
          occupation: "working",
          dailyTargetMinutes: 30,
        },
        subscription: {
          tier: "free",
          expiresAt: null,
        },
      });
      console.log("🎉 ĐÃ TẠO MỚI TÀI KHOẢN QUẢN TRỊ VIÊN THÀNH CÔNG:");
      console.log(`   - Username: ${admin.username}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - Mật khẩu: ${targetPassword}`);
      console.log(`   - Vai trò: ${admin.role} (Toàn quyền hệ thống, không cần gói subscription)`);
    }

    await mongoose.disconnect();
    console.log("✅ Đã hoàn tất và đóng kết nối CSDL.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi thiết lập tài khoản admin:", error);
    process.exit(1);
  }
};

promoteOrCreateAdmin();
