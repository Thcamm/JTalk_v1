import mongoose from "mongoose";

const vocabularySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kanji: {
      type: String,
      required: true,
      trim: true,
    },
    furigana: {
      type: String,
      trim: true,
      default: "",
    },
    romaji: {
      type: String,
      trim: true,
      default: "",
    },
    meaning: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["N5", "N4", "N3", "N2", "N1"],
      default: "N5",
    },
    wordType: {
      type: String,
      enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"],
      default: "phrase",
    },
    exampleSentence: {
      type: String,
      default: "",
    },
    exampleTranslation: {
      type: String,
      default: "",
    },
    isMastered: {
      type: Boolean,
      default: false,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    sourceLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries
vocabularySchema.index({ userId: 1, level: 1, isMastered: 1 });

const Vocabulary = mongoose.model("Vocabulary", vocabularySchema);
export default Vocabulary;
