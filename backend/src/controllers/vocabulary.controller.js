import Vocabulary from "../models/Vocabulary.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/vocabularies
 * Retrieves user's saved vocabulary items with filters
 */
export const getVocabularies = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { level, isMastered, search } = req.query;

    const query = { userId };

    if (level && level !== "all") {
      query.level = level;
    }

    if (isMastered !== undefined && isMastered !== "all") {
      query.isMastered = isMastered === "true";
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { kanji: searchRegex },
        { furigana: searchRegex },
        { romaji: searchRegex },
        { meaning: searchRegex },
      ];
    }

    const items = await Vocabulary.find(query).sort({ createdAt: -1 });

    return successResponse(res, items, "Lấy danh sách sổ tay từ vựng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/vocabularies
 * Saves a new vocabulary item to user's notebook
 */
export const createVocabulary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      kanji,
      furigana,
      romaji,
      meaning,
      level,
      wordType,
      exampleSentence,
      exampleTranslation,
      sourceLessonId,
      tags,
    } = req.body;

    if (!kanji || !meaning) {
      const error = new Error("Vui lòng nhập từ tiếng Nhật (Kanji/Kana) và Nghĩa tiếng Việt.");
      error.statusCode = 400;
      throw error;
    }

    // Check if word already exists for this user
    const existing = await Vocabulary.findOne({
      userId,
      kanji: kanji.trim(),
    });

    if (existing) {
      existing.furigana = furigana || existing.furigana;
      existing.meaning = meaning || existing.meaning;
      existing.exampleSentence = exampleSentence || existing.exampleSentence;
      existing.exampleTranslation = exampleTranslation || existing.exampleTranslation;
      if (level) existing.level = level;
      await existing.save();

      return successResponse(res, existing, "Từ vựng đã có trong sổ tay và vừa được cập nhật!");
    }

    const newItem = await Vocabulary.create({
      userId,
      kanji: kanji.trim(),
      furigana: furigana?.trim() || "",
      romaji: romaji?.trim() || "",
      meaning: meaning.trim(),
      level: level || "N5",
      wordType: wordType || "phrase",
      exampleSentence: exampleSentence?.trim() || "",
      exampleTranslation: exampleTranslation?.trim() || "",
      sourceLessonId: sourceLessonId || null,
      tags: tags || [],
    });

    return successResponse(res, newItem, "Đã lưu từ vựng vào Sổ tay ôn tập!");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/vocabularies/:id/mastered
 * Toggles or updates mastered status & increments review count
 */
export const toggleMastered = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { isMastered } = req.body;

    const item = await Vocabulary.findOne({ _id: id, userId });
    if (!item) {
      const error = new Error("Không tìm thấy từ vựng trong sổ tay.");
      error.statusCode = 404;
      throw error;
    }

    if (typeof isMastered === "boolean") {
      item.isMastered = isMastered;
    } else {
      item.isMastered = !item.isMastered;
    }

    item.reviewCount = (item.reviewCount || 0) + 1;
    item.lastReviewedAt = new Date();
    await item.save();

    return successResponse(
      res,
      item,
      item.isMastered ? "Đã đánh dấu thuộc từ vựng!" : "Đã chuyển vào danh sách cần ôn tập!"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/vocabularies/:id
 * Removes vocabulary item from notebook
 */
export const deleteVocabulary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await Vocabulary.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      const error = new Error("Không tìm thấy từ vựng để xóa.");
      error.statusCode = 404;
      throw error;
    }

    return successResponse(res, { id }, "Đã xóa từ vựng khỏi sổ tay.");
  } catch (error) {
    next(error);
  }
};
