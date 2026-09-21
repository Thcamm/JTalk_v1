import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
    name: {
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
    image: {
      type: String,
    },
    category: {
      type: String,
      default: "daily",
      trim: true,
    },
    isPremiumOnly: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
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

topicSchema.index({ level: 1, isPublished: 1 });
topicSchema.index({ courseId: 1, isPublished: 1 });

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;
