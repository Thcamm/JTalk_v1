import mongoose from "mongoose";

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
    sampleSentence: {
      type: String,
      required: true,
      trim: true,
    },
    translation: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    duration: {
      type: String,
      default: "10 phút",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ topicId: 1, isPublished: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
