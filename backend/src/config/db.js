import mongoose from "mongoose";
import config from "./index.js";

export const connectDB = async () => {
  try {
    const uri = config.mongoUri || process.env.MONGODB_CONNECTIONSTRING;
    if (!uri) {
      throw new Error("MONGODB_CONNECTIONSTRING chưa được cấu hình trong file .env");
    }
    // @ts-ignore
    await mongoose.connect(uri);
    console.log("✅ Liên kết CSDL MongoDB Atlas thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi kết nối CSDL:", error.message || error);
    process.exit(1);
  }
};

export default connectDB;
