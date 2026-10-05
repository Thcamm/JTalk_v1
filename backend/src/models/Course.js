import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
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
      enum: ["N5", "N4", "N3", "N2", "N1", "All"],
      default: "N5",
      trim: true,
    },
    category: {
      type: String,
      default: "kaiwa",
    },
    courseType: {
      type: String,
      enum: ["video_series", "ai_kaiwa", "grammar_curriculum"],
      default: "video_series",
    },
    sourceType: {
      type: String,
      enum: ["community", "jtalk"],
      default: "community",
      index: true,
    },
    channelName: {
      type: String,
      trim: true,
    },
    channelUrl: {
      type: String,
      trim: true,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    totalDurationMinutes: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    thumbnail: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isPremiumOnly: {
      type: Boolean,
      default: false,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ level: 1, isPublished: 1 });
courseSchema.index({ orderIndex: 1 });

const Course = mongoose.model("Course", courseSchema);
export default Course;
