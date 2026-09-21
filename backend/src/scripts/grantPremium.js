import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

dotenv.config({ path: "./backend/.env" });
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config({ path: "../backend/.env" });
}
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config();
}

const grantPremium = async () => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTIONSTRING;
    if (!mongoUri) {
      console.error("❌ MONGODB_CONNECTIONSTRING chưa được cấu hình!");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Kết nối MongoDB Atlas thành công!");

    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const defaultHashedPassword = await bcrypt.hash("password123", 10);

    // 1. Tạo hoặc cập nhật tài khoản dedicated: premium_test / password123
    let dedicatedUser = await User.findOne({ username: "premium_test" });
    if (!dedicatedUser) {
      dedicatedUser = await User.create({
        username: "premium_test",
        email: "premium@jtalk.com",
        hashedPassword: defaultHashedPassword,
        displayName: "JTalk Premium VIP",
        role: "user",
        subscription: {
          tier: "premium",
          expiresAt: oneYearLater,
        },
      });
      console.log("✅ Đã tạo mới tài khoản premium_test");
    } else {
      dedicatedUser.hashedPassword = defaultHashedPassword;
      dedicatedUser.subscription = {
        tier: "premium",
        expiresAt: oneYearLater,
      };
      await dedicatedUser.save();
      console.log("✅ Đã cập nhật tài khoản premium_test lên Premium");
    }

    // Tạo bản ghi Subscription cho premium_test
    await Subscription.findOneAndUpdate(
      { userId: dedicatedUser._id },
      {
        userId: dedicatedUser._id,
        planType: "yearly_899k",
        price: 899000,
        status: "active",
        startDate: new Date(),
        endDate: oneYearLater,
      },
      { upsert: true, new: true }
    );

    // 2. Nâng cấp tất cả các tài khoản hiện có lên Premium và gán Subscription
    const existingUsers = await User.find({});
    for (const u of existingUsers) {
      u.subscription = {
        tier: "premium",
        expiresAt: oneYearLater,
      };
      await u.save();

      await Subscription.findOneAndUpdate(
        { userId: u._id },
        {
          userId: u._id,
          planType: "yearly_899k",
          price: 899000,
          status: "active",
          startDate: new Date(),
          endDate: oneYearLater,
        },
        { upsert: true, new: true }
      );
      console.log(`⭐ Đã nâng cấp Premium cho user: ${u.username} (${u.email})`);
    }

    console.log("\n=======================================================");
    console.log("🎉 ĐÃ CẤP XONG TÀI KHOẢN PREMIUM TEST:");
    console.log("-------------------------------------------------------");
    console.log("👉 Tài khoản mới chuyên dùng để test:");
    console.log("   - Username: premium_test");
    console.log("   - Email:    premium@jtalk.com");
    console.log("   - Password: password123");
    console.log("   - Hạn dùng: 1 năm (Vô hạn lượt luyện nói & Mở khóa toàn bộ kịch bản)");
    console.log("-------------------------------------------------------");
    console.log("👉 Các tài khoản hiện tại của bạn cũng đã được nâng cấp lên Premium:");
    console.log("   - cam (nguyenducthiencam2k6@gmail.com)");
    console.log("   - nguyenducthiencam2k5@gmail.com");
    console.log("   - user1 / user2");
    console.log("   (Nếu đang đăng nhập trên trình duyệt, chỉ cần F5 là có Premium ngay!)");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Lỗi khi cấp premium:", err);
    process.exit(1);
  }
};

grantPremium();
