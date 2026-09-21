import mongoose from "mongoose";

const studyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    minutesSpent: {
      type: Number,
      default: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    lessonsCompleted: {
      type: Number,
      default: 0,
    },
    practiceCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Một user chỉ có 1 record log cho mỗi ngày
studyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const StudyLog = mongoose.model("StudyLog", studyLogSchema);
export default StudyLog;
