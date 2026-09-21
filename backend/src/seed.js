import dotenv from "dotenv";
import mongoose from "mongoose";
import Topic from "./models/Topic.js";
import Lesson from "./models/Lesson.js";

dotenv.config();

const seedData = async () => {
  try {
    if (!process.env.MONGODB_CONNECTIONSTRING) {
      console.error("MONGODB_CONNECTIONSTRING chưa được cấu hình trong .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Đã kết nối CSDL thành công để seed!");

    // Clear existing Topics and Lessons
    await Topic.deleteMany({});
    await Lesson.deleteMany({});
    console.log("Đã xoá dữ liệu Topic & Lesson cũ.");

    // Create Topics
    const topic1 = await Topic.create({
      name: "新しいクラスでの自己紹介",
      description: "Luyện tập tự giới thiệu bản thân trong lớp học mới.",
      level: "N5",
      image: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=800",
      isPublished: true,
    });

    const topic2 = await Topic.create({
      name: "毎日の生活について",
      description: "Nói về cuộc sống và thói quen hàng ngày.",
      level: "N5",
      image: "https://images.pexels.com/photos/267507/pexels-photo-267507.jpeg?auto=compress&cs=tinysrgb&w=800",
      isPublished: true,
    });

    const topic3 = await Topic.create({
      name: "病院で診察を受ける",
      description: "Mô tả triệu chứng bệnh và nói chuyện với bác sĩ.",
      level: "N4",
      image: "https://images.pexels.com/photos/1184572/pexels-photo-1184572.jpeg?auto=compress&cs=tinysrgb&w=800",
      isPublished: true,
    });

    const topic4 = await Topic.create({
      name: "カフェで飲み物を注文する",
      description: "Gọi đồ uống tại quán café một cách tự nhiên.",
      level: "N4",
      image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
      isPublished: true,
    });

    console.log("Đã tạo xong Topics.");

    // Create Lessons
    await Lesson.create([
      {
        topicId: topic1._id,
        title: "はじめまして (Tự giới thiệu)",
        description: "Học cách tự giới thiệu tên và chào hỏi ban đầu.",
        level: "N5",
        sampleSentence: "はじめまして、わたしはマリアです。どうぞよろしくおねがいします。",
        translation: "Rất vui được gặp bạn, tôi là Maria. Rất mong nhận được sự giúp đỡ.",
        image: topic1.image,
        duration: "10 phút",
        isPublished: true,
      },
      {
        topicId: topic1._id,
        title: "出身と職業 (Quê quán & Nghề nghiệp)",
        description: "Học cách giới thiệu nơi mình đến và công việc hiện tại.",
        level: "N5",
        sampleSentence: "ベトナムからきました。ハノイ大学の学生です。",
        translation: "Tôi đến từ Việt Nam. Tôi là sinh viên đại học Hà Nội.",
        image: topic1.image,
        duration: "8 phút",
        isPublished: true,
      },
      {
        topicId: topic2._id,
        title: "毎朝の習慣 (Thói quen buổi sáng)",
        description: "Học cách nói về các hoạt động diễn ra mỗi sáng.",
        level: "N5",
        sampleSentence: "わたしは毎朝6時に起きます。それからパンを食べます。",
        translation: "Tôi thức dậy vào 6 giờ sáng mỗi ngày. Sau đó tôi ăn bánh mì.",
        image: topic2.image,
        duration: "10 phút",
        isPublished: true,
      },
      {
        topicId: topic3._id,
        title: "症状を伝える (Mô tả triệu chứng)",
        description: "Nói cho bác sĩ biết về cơn đau hoặc cơn sốt.",
        level: "N4",
        sampleSentence: "昨日から頭が痛くて、少し熱もあります。",
        translation: "Từ hôm qua tôi bị đau đầu và hơi sốt.",
        image: topic3.image,
        duration: "12 phút",
        isPublished: true,
      },
      {
        topicId: topic4._id,
        title: "飲み物を注文する (Gọi đồ uống)",
        description: "Thực hành gọi cà phê và đồ uống tại quán.",
        level: "N4",
        sampleSentence: "アイスコーヒーをひとつとケーキをお願いします。",
        translation: "Cho tôi một cà phê đá và một phần bánh ngọt.",
        image: topic4.image,
        duration: "8 phút",
        isPublished: true,
      },
    ]);

    console.log("Đã tạo xong Lessons thành công!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi chạy seed script:", error);
    process.exit(1);
  }
};

seedData();
