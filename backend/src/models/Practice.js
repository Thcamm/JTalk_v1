import mongoose from "mongoose";

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
      required: true,
      trim: true,
    },
    audioUrl: {
      type: String,
    },
    transcript: {
      type: String,
    },
    score: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
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

const Practice = mongoose.model("Practice", practiceSchema);
export default Practice;
