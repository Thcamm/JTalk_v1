import dotenv from "dotenv";
import mongoose from "mongoose";
import Course from "./models/Course.js";
import Topic from "./models/Topic.js";
import Lesson from "./models/Lesson.js";
import Practice from "./models/Practice.js";
import Order from "./models/Order.js";
import Subscription from "./models/Subscription.js";
import StudyLog from "./models/StudyLog.js";
import User from "./models/User.js";

dotenv.config();
if (!process.env.MONGODB_CONNECTIONSTRING) {
  dotenv.config({ path: "./backend/.env" });
}

const seedData = async () => {
  try {
    if (!process.env.MONGODB_CONNECTIONSTRING) {
      console.error("MONGODB_CONNECTIONSTRING chưa được cấu hình trong .env");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Đã kết nối CSDL thành công để seed!");

    // Đảm bảo tất cả collections và indexes được khởi tạo vật lý trên MongoDB Atlas
    await Course.createCollection();
    await Topic.createCollection();
    await Lesson.createCollection();
    await Practice.createCollection();
    await Order.createCollection();
    await Subscription.createCollection();
    await StudyLog.createCollection();

    await Course.init();
    await Topic.init();
    await Lesson.init();
    await Practice.init();
    await Order.init();
    await Subscription.init();
    await StudyLog.init();
    await User.init();
    console.log("Đã khởi tạo metadata và indexes cho toàn bộ collections trên Atlas.");

    // Clear existing Courses, Topics and Lessons
    await Course.deleteMany({});
    await Topic.deleteMany({});
    await Lesson.deleteMany({});
    console.log("Đã xoá dữ liệu Course, Topic & Lesson cũ.");

    // 1. Tạo Khóa học (Courses)
    const courseN5 = await Course.create({
      title: "Kaiwa Beginner - Phản xạ giao tiếp N5",
      description:
        "Luyện tập phản xạ giao tiếp đời sống hàng ngày từ con số 0 đến N5 cùng trợ lý AI.",
      level: "N5",
      category: "daily",
      thumbnail:
        "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=800",
      isPublished: true,
      isPremiumOnly: false,
      orderIndex: 1,
    });

    const courseN4 = await Course.create({
      title: "Business Japanese & Phỏng vấn N4",
      description:
        "Kịch bản giao tiếp công sở, gọi điện thoại, báo cáo HORENSO và phỏng vấn xin việc.",
      level: "N4",
      category: "business",
      thumbnail:
        "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
      isPublished: true,
      isPremiumOnly: true,
      orderIndex: 2,
    });

    console.log("Đã tạo xong Courses.");

    // 2. Tạo Chủ đề (Topics)
    const topic1 = await Topic.create({
      courseId: courseN5._id,
      name: "新しいクラスでの自己紹介",
      description: "Luyện tập tự giới thiệu bản thân trong lớp học mới.",
      level: "N5",
      image:
        "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "daily",
      isPremiumOnly: false,
      isPublished: true,
      orderIndex: 1,
    });

    const topic2 = await Topic.create({
      courseId: courseN5._id,
      name: "毎日の生活について",
      description: "Nói về cuộc sống và thói quen hàng ngày.",
      level: "N5",
      image:
        "https://images.pexels.com/photos/267507/pexels-photo-267507.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "daily",
      isPremiumOnly: false,
      isPublished: true,
      orderIndex: 2,
    });

    const topic3 = await Topic.create({
      courseId: courseN4._id,
      name: "病院で診察を受ける",
      description: "Mô tả triệu chứng bệnh và nói chuyện với bác sĩ.",
      level: "N4",
      image:
        "https://images.pexels.com/photos/1184572/pexels-photo-1184572.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "daily",
      isPremiumOnly: false,
      isPublished: true,
      orderIndex: 3,
    });

    const topic4 = await Topic.create({
      courseId: courseN4._id,
      name: "カフェで飲み物を注文する",
      description: "Gọi đồ uống tại quán café một cách tự nhiên.",
      level: "N4",
      image:
        "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "daily",
      isPremiumOnly: false,
      isPublished: true,
      orderIndex: 4,
    });

    const topic5 = await Topic.create({
      courseId: courseN4._id,
      name: "IT企業での面接練習 (Phỏng vấn IT)",
      description: "Kịch bản phỏng vấn kỹ sư phần mềm bằng tiếng Nhật (Premium).",
      level: "N4",
      image:
        "https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800",
      category: "interview",
      isPremiumOnly: true,
      isPublished: true,
      orderIndex: 5,
    });

    console.log("Đã tạo xong Topics.");

    // 3. Tạo Bài học (Lessons) với Cấu trúc Hội thoại nhiều lượt (dialogues)
    const lessons = await Lesson.create([
      {
        topicId: topic1._id,
        title: "はじめまして (Tự giới thiệu)",
        description: "Học cách tự giới thiệu tên, quê quán và chào hỏi ban đầu.",
        level: "N5",
        sampleSentence: "はじめまして、わたしはマリアです。どうぞよろしくおねがいします。",
        translation: "Rất vui được gặp bạn, tôi là Maria. Rất mong nhận được sự giúp đỡ.",
        image: topic1.image,
        duration: "10 phút",
        durationMinutes: 10,
        isPremiumOnly: false,
        isPublished: true,
        dialogues: [
          {
            order: 1,
            sceneIndex: 0,
            speaker: "ai",
            japanese: "こんにちは！はじめまして。",
            romaji: "Konnichiwa! Hajimemashite.",
            translation: "Xin chào! Rất vui được gặp bạn.",
            expectedAnswer: "はじめまして",
            hints: ["Chào lại bằng câu はじめまして"],
          },
          {
            order: 2,
            sceneIndex: 0,
            speaker: "user",
            japanese: "はじめまして、ナムです。どうぞよろしくおねがいします。",
            romaji: "Hajimemashite, Namu desu. Douzo yoroshiku onegaishimasu.",
            translation: "Rất vui được gặp bạn, tôi là Nam. Rất mong được giúp đỡ.",
            expectedAnswer: "はじめまして、ナムです。どうぞよろしくおねがいします。",
          },
          {
            order: 3,
            sceneIndex: 0,
            speaker: "ai",
            japanese: "どちらから来ましたか？",
            romaji: "Dochira kara kimashita ka?",
            translation: "Bạn đến từ đâu vậy?",
            expectedAnswer: "ベトナムから来ました",
            hints: ["Tên quốc gia + から来ました"],
          },
          {
            order: 4,
            sceneIndex: 0,
            speaker: "user",
            japanese: "ベトナムから来ました。ハノイ大学の学生です。",
            romaji: "Betonamu kara kimashita. Hanoi daigaku no gakusei desu.",
            translation: "Tôi đến từ Việt Nam. Tôi là sinh viên đại học Hà Nội.",
            expectedAnswer: "ベトナムから来ました。ハノイ大学の学生です。",
          },
        ],
        vocabularyList: [
          { word: "はじめまして", meaning: "Rất vui được gặp bạn", romaji: "hajimemashite" },
          { word: "学生", meaning: "Học sinh/sinh viên", kanji: "学生", romaji: "gakusei" },
          { word: "よろしく", meaning: "Mong được giúp đỡ", romaji: "yoroshiku" },
        ],
      },
      {
        topicId: topic1._id,
        title: "出身と職業 (Quê quán & Nghề nghiệp)",
        description: "Học cách giới thiệu nơi mình đến và công việc hiện tại.",
        level: "N5",
        sampleSentence: "ベトナムからきました。エンジニアです。",
        translation: "Tôi đến từ Việt Nam. Tôi là kỹ sư.",
        image: topic1.image,
        duration: "8 phút",
        durationMinutes: 8,
        isPremiumOnly: false,
        isPublished: true,
        dialogues: [
          {
            order: 1,
            sceneIndex: 0,
            speaker: "ai",
            japanese: "お仕事は何をされていますか？",
            romaji: "Oshigoto wa nani o sarete imasu ka?",
            translation: "Bạn đang làm công việc gì thế?",
            expectedAnswer: "エンジニアです",
          },
          {
            order: 2,
            sceneIndex: 0,
            speaker: "user",
            japanese: "わたしはエンジニアです。IT企業で働いています。",
            romaji: "Watashi wa enjinia desu. IT kigyou de hataraite imasu.",
            translation: "Tôi là kỹ sư. Tôi đang làm việc tại một công ty IT.",
            expectedAnswer: "わたしはエンジニアです。",
          },
        ],
        vocabularyList: [
          { word: "仕事", meaning: "Công việc", kanji: "仕事", romaji: "shigoto" },
          { word: "エンジニア", meaning: "Kỹ sư", romaji: "enjinia" },
        ],
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
        durationMinutes: 10,
        isPremiumOnly: false,
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
        durationMinutes: 12,
        isPremiumOnly: false,
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
        durationMinutes: 8,
        isPremiumOnly: false,
        isPublished: true,
      },
      {
        topicId: topic5._id,
        title: "自己PRと志望動機 (Tự PR & Động lực ứng tuyển)",
        description: "Kịch bản phỏng vấn chuyên sâu cho kỹ sư cầu nối BrSE hoặc IT (Premium).",
        level: "N4",
        sampleSentence: "わたしの強みは問題解決力です。御社でスキルを活かしたいです。",
        translation: "Thế mạnh của tôi là khả năng giải quyết vấn đề. Tôi muốn cống hiến tại quý công ty.",
        image: topic5.image,
        duration: "15 phút",
        durationMinutes: 15,
        isPremiumOnly: true,
        isPublished: true,
      },
    ]);

    console.log("Đã tạo xong Lessons thành công!");

    // 4. Seed dữ liệu mẫu cho Order, Subscription, StudyLog, Practice nếu có User
    const sampleUser = await User.findOne();
    if (sampleUser) {
      console.log(`Tìm thấy user mẫu: ${sampleUser.username}, bắt đầu seed dữ liệu liên quan...`);

      // Cập nhật Profile, Gamification, Referral cho user
      sampleUser.role = "admin";
      sampleUser.profile = {
        targetLevel: "N5",
        goal: "daily_conversation",
        occupation: "working",
        dailyTargetMinutes: 20,
      };
      sampleUser.gamification = {
        streak: 12,
        longestStreak: 15,
        lastActiveDate: new Date(),
        totalXp: 1240,
        level: 3,
      };
      sampleUser.referral = {
        referralCode: "JTALK88",
        successfulInvites: 2,
        bonusDaysEarned: 14,
      };

      // Tạo Order MoMo mẫu
      await Order.deleteMany({ userId: sampleUser._id });
      const sampleOrder = await Order.create({
        orderCode: `JTALK_${Date.now()}`,
        userId: sampleUser._id,
        amount: 99000,
        paymentMethod: "momo",
        status: "completed",
        transactionId: "MOMO_TRANS_987654321",
        paidAt: new Date(),
      });

      // Tạo Subscription Premium mẫu
      await Subscription.deleteMany({ userId: sampleUser._id });
      const sampleSubscription = await Subscription.create({
        userId: sampleUser._id,
        planType: "monthly_99k",
        price: 99000,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
        orderId: sampleOrder._id,
      });

      sampleUser.subscription = {
        tier: "premium",
        expiresAt: sampleSubscription.endDate,
        subscriptionId: sampleSubscription._id,
      };
      await sampleUser.save();
      console.log("Đã seed xong Order và Subscription cho user!");

      // Tạo StudyLog 7 ngày gần nhất
      await StudyLog.deleteMany({ userId: sampleUser._id });
      const dayMinutes = [20, 35, 15, 42, 50, 28, 38];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        await StudyLog.create({
          userId: sampleUser._id,
          date: dateStr,
          minutesSpent: dayMinutes[6 - i] || 30,
          xpEarned: (dayMinutes[6 - i] || 30) * 10,
          lessonsCompleted: 2,
          practiceCount: 3,
        });
      }
      console.log("Đã seed xong StudyLogs 7 ngày gần nhất!");

      // Tạo bài Practice mẫu với điểm số phân rã 4 tiêu chí và feedback chi tiết
      await Practice.deleteMany({ userId: sampleUser._id });
      await Practice.create({
        userId: sampleUser._id,
        lessonId: lessons[0]._id,
        sampleSentence: lessons[0].sampleSentence,
        durationSeconds: 45,
        audioUrl: "https://example.com/audio/sample.mp3",
        transcript: "はじめまして、わたしはマリアです。どうぞよろしくおねがいします。",
        status: "completed",
        score: 92,
        overallScore: 92,
        scores: {
          pronunciation: 90,
          accuracy: 95,
          fluency: 92,
          completeness: 94,
        },
        wordFeedback: [
          { word: "はじめまして", isCorrect: true, accuracyScore: 95, errorType: "none" },
          { word: "わたしは", isCorrect: true, accuracyScore: 92, errorType: "none" },
          { word: "マリア", isCorrect: true, accuracyScore: 88, errorType: "none" },
          { word: "です", isCorrect: true, accuracyScore: 94, errorType: "none" },
          {
            word: "どうぞ",
            isCorrect: false,
            accuracyScore: 65,
            errorType: "mispronunciation",
            suggestion: "Chú ý trường âm 'u' kéo dài ở âm /dōzo/",
          },
          { word: "よろしく", isCorrect: true, accuracyScore: 90, errorType: "none" },
          { word: "おねがいします", isCorrect: true, accuracyScore: 96, errorType: "none" },
        ],
        feedback: {
          grammarSuggestions: ["Câu nói tự nhiên, chuẩn mực trong bối cảnh chào hỏi lần đầu."],
          generalAdvice: "Phát âm rất tốt, ngữ điệu tự tin. Cần chú ý thêm trường âm (chōon).",
        },
        completedAt: new Date(),
      });
      console.log("Đã seed xong Practice mẫu kèm đánh giá AI chi tiết!");
    }

    await mongoose.connection.close();
    console.log("Đã đóng kết nối CSDL. Toàn bộ collections đã sẵn sàng trên Atlas!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi chạy seed script:", error);
    process.exit(1);
  }
};

seedData();
