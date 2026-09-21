import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
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
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

topicSchema.index({ level: 1, isPublished: 1 });

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;
