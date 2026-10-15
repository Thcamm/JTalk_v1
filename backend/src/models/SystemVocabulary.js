import mongoose from "mongoose";

const systemVocabularySchema = new mongoose.Schema(
  {
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
      index: true,
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
    source: {
      type: String,
      default: "Quizlet JLPT",
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

systemVocabularySchema.index({ kanji: 1, level: 1 });
systemVocabularySchema.index({ level: 1, createdAt: -1 });

const SystemVocabulary = mongoose.model("SystemVocabulary", systemVocabularySchema);
export default SystemVocabulary;
