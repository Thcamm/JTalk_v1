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
      enum: ["kaiwa", "grammar", "business", "interview", "daily"],
      default: "kaiwa",
    },
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
