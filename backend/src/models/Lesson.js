import mongoose from "mongoose";

const dialogueSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    sceneIndex: {
      type: Number,
      default: 0,
    },
    sceneImage: {
      type: String,
    },
    speaker: {
      type: String,
      enum: ["ai", "user"],
      required: true,
    },
    japanese: {
      type: String,
      required: true,
      trim: true,
    },
    romaji: {
      type: String,
      trim: true,
    },
    furigana: {
      type: String,
      trim: true,
    },
    translation: {
      type: String,
      required: true,
      trim: true,
    },
    audioUrl: {
      type: String,
    },
    expectedAnswer: {
      type: String,
      trim: true,
    },
    hints: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const vocabularySchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
    },
    kanji: {
      type: String,
      trim: true,
    },
    romaji: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const subtitleWordSchema = new mongoose.Schema(
  {
    kanji: { type: String, required: true },
    furigana: { type: String },
    romaji: { type: String },
    meaning: { type: String },
  },
  { _id: false }
);

const subtitleSchema = new mongoose.Schema(
  {
    startTime: { type: Number, required: true }, // Giây bắt đầu
    endTime: { type: Number, required: true },   // Giây kết thúc
    japanese: { type: String, required: true, trim: true },
    furigana: { type: String, trim: true },
    romaji: { type: String, trim: true },
    translation: { type: String, required: true, trim: true },
    words: [subtitleWordSchema],
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      default: "N5",
      trim: true,
    },
    // Trường câu mẫu đơn lẻ (giữ để tương thích ngược với MVP)
    sampleSentence: {
      type: String,
      trim: true,
    },
    translation: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    // Video YouTube & Khóa học Shadowing
    youtubeId: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      trim: true,
    },
    channelName: {
      type: String,
      trim: true,
    },
    subtitles: [subtitleSchema],
    duration: {
      type: String,
      default: "10 phút",
    },
    durationMinutes: {
      type: Number,
      default: 10,
    },
    isPremiumOnly: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    // Cấu trúc Hội thoại nhiều lượt (Turn-based / Scenes)
    dialogues: [dialogueSchema],

    // Danh sách từ vựng trọng tâm trong bài
    vocabularyList: [vocabularySchema],
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ topicId: 1, isPublished: 1 });
lessonSchema.index({ level: 1, isPublished: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
