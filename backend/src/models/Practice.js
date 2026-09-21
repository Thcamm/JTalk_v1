import mongoose from "mongoose";

const wordFeedbackSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      default: true, // true: Xanh, false: Đỏ
    },
    accuracyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    errorType: {
      type: String,
      enum: ["none", "mispronunciation", "omission", "insertion", "grammar"],
      default: "none",
    },
    suggestion: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const practiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    sampleSentence: {
      type: String,
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    audioUrl: {
      type: String,
    },
    transcript: {
      type: String, // Văn bản nhận diện từ microphone
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    // Điểm số tương thích ngược và Điểm tổng
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Điểm phân rã 4 tiêu chí
    scores: {
      pronunciation: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      accuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      fluency: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      completeness: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },

    // Danh sách từ lỗi tô màu Đỏ / Xanh
    wordFeedback: [wordFeedbackSchema],

    // Nhận xét AI và gợi ý ngữ pháp
    feedback: {
      grammarSuggestions: [
        {
          type: String,
          trim: true,
        },
      ],
      generalAdvice: {
        type: String,
        trim: true,
      },
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

practiceSchema.index({ userId: 1, createdAt: -1 });
practiceSchema.index({ lessonId: 1, createdAt: -1 });

const Practice = mongoose.model("Practice", practiceSchema);
export default Practice;
