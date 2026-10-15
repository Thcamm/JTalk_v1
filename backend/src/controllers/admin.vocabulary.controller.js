import SystemVocabulary from "../models/SystemVocabulary.js";
import Lesson from "../models/Lesson.js";
import Vocabulary from "../models/Vocabulary.js";
import AiService from "../services/ai.service.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import {
  translateToVietnamese,
  sanitizeExampleTranslation,
} from "../utils/japaneseMeaningTranslator.js";

/**
 * POST /api/v1/admin/vocabulary/ai-enrich
 * Use AI to classify wordType and enrich Furigana / Romaji
 */
export const enrichVocabularyWithAiHandler = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, "Danh sách từ vựng để phân tích AI đang trống.", 400);
    }

    // Giới hạn xử lý tối đa 60 từ mỗi lần gọi để tránh timeout
    const batch = items.slice(0, 60);
    const enriched = await AiService.enrichVocabularyBatchWithAi(batch);

    return successResponse(res, enriched, "AI đã phân tích và chuẩn hóa từ loại thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/vocabulary/import
 * Bulk import vocabulary items into JTalk Master Bank
 */
export const importVocabulary = async (req, res, next) => {
  try {
    const { items, defaultLevel = "N5", overwrite = false, tags = ["jtalk"], source = "JTalk Master Bank" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, "Danh sách từ vựng không hợp lệ hoặc đang trống.", 400);
    }

    const adminId = req.user?._id || null;
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Chuẩn hóa và làm sạch dữ liệu
    const cleanedItems = items
      .map((item) => {
        const kanji = (item.kanji || item.word || "").trim();
        const rawMeaning = (item.meaning || item.definition || "").trim();
        const meaning = translateToVietnamese(kanji, rawMeaning);
        const furigana = (item.furigana || "").trim();
        const romaji = (item.romaji || "").trim();
        const level = ["N5", "N4", "N3", "N2", "N1"].includes(item.level) ? item.level : defaultLevel;
        const wordType = ["noun", "verb", "adjective", "adverb", "phrase", "other"].includes(item.wordType)
          ? item.wordType
          : "phrase";
        const exampleTranslation = sanitizeExampleTranslation(
          kanji,
          meaning,
          (item.exampleTranslation || "").trim()
        );

        return {
          kanji,
          furigana: furigana || (kanji && !/[一-龯]/.test(kanji) ? kanji : ""),
          romaji,
          meaning,
          level,
          wordType,
          exampleSentence: (item.exampleSentence || "").trim(),
          exampleTranslation,
          source: (item.source || source).trim(),
          tags: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : tags,
          createdBy: adminId,
        };
      })
      .filter((i) => Boolean(i.kanji && i.meaning));

    if (cleanedItems.length === 0) {
      return errorResponse(res, "Không tìm thấy từ vựng hợp lệ (yêu cầu có từ tiếng Nhật và nghĩa).", 400);
    }

    // Xử lý theo từng batch 100 từ để tối ưu hiệu năng MongoDB
    const BATCH_SIZE = 100;
    for (let i = 0; i < cleanedItems.length; i += BATCH_SIZE) {
      const batch = cleanedItems.slice(i, i + BATCH_SIZE);
      const kanjiList = batch.map((b) => b.kanji);

      // Tra cứu các từ đã tồn tại trong cùng level
      const existingDocs = await SystemVocabulary.find({
        kanji: { $in: kanjiList },
        level: batch[0].level,
      }).select("kanji level");

      const existingMap = new Map();
      existingDocs.forEach((doc) => existingMap.set(`${doc.kanji}_${doc.level}`, doc._id));

      const bulkOps = [];

      for (const item of batch) {
        const key = `${item.kanji}_${item.level}`;
        const existingId = existingMap.get(key);

        if (existingId) {
          if (overwrite) {
            bulkOps.push({
              updateOne: {
                filter: { _id: existingId },
                update: {
                  $set: {
                    furigana: item.furigana,
                    romaji: item.romaji,
                    meaning: item.meaning,
                    wordType: item.wordType,
                    exampleSentence: item.exampleSentence,
                    exampleTranslation: item.exampleTranslation,
                    source: item.source,
                    tags: item.tags,
                  },
                },
              },
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          bulkOps.push({
            insertOne: {
              document: item,
            },
          });
          insertedCount++;
        }
      }

      if (bulkOps.length > 0) {
        await SystemVocabulary.bulkWrite(bulkOps);
      }
    }

    return successResponse(
      res,
      {
        totalReceived: items.length,
        totalValid: cleanedItems.length,
        insertedCount,
        updatedCount,
        skippedCount,
      },
      `Đã nhập thành công ${insertedCount} từ mới, cập nhật ${updatedCount} từ và bỏ qua ${skippedCount} từ trùng lặp!`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/vocabulary/import-to-lesson
 * Import vocabulary list directly into a specific Lesson
 */
export const importVocabularyToLesson = async (req, res, next) => {
  try {
    const { lessonId, items, replaceExisting = false } = req.body;

    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return errorResponse(res, "Mã bài học (Lesson ID) không hợp lệ.", 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, "Danh sách từ vựng không hợp lệ hoặc đang trống.", 400);
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return errorResponse(res, "Không tìm thấy bài học tương ứng.", 404);
    }

    const formattedList = items
      .map((item) => {
        const word = (item.kanji || item.word || "").trim();
        const meaning = (item.meaning || item.definition || "").trim();
        const kanji = (item.kanji || "").trim();
        const romaji = (item.romaji || "").trim();
        return {
          word,
          meaning,
          kanji: kanji || word,
          romaji,
        };
      })
      .filter((i) => Boolean(i.word && i.meaning));

    if (replaceExisting) {
      lesson.vocabularyList = formattedList;
    } else {
      // Bổ sung thêm, chống trùng theo word
      const existingWords = new Set((lesson.vocabularyList || []).map((v) => v.word));
      const newWords = formattedList.filter((v) => !existingWords.has(v.word));
      lesson.vocabularyList = [...(lesson.vocabularyList || []), ...newWords];
    }

    await lesson.save();

    return successResponse(
      res,
      {
        lessonId: lesson._id,
        title: lesson.title,
        totalVocabulary: lesson.vocabularyList.length,
      },
      `Đã cập nhật ${lesson.vocabularyList.length} từ vựng cho bài học "${lesson.title}" thành công!`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/vocabulary
 * Paginated list of system vocabularies with filter & counts
 */
export const getAdminVocabularies = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const { search, level } = req.query;
    const filter = {};

    if (level && ["N5", "N4", "N3", "N2", "N1"].includes(level)) {
      filter.level = level;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { kanji: regex },
        { furigana: regex },
        { romaji: regex },
        { meaning: regex },
        { tags: regex },
      ];
    }

    const [items, total, statsAggregation] = await Promise.all([
      SystemVocabulary.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SystemVocabulary.countDocuments(filter),
      SystemVocabulary.aggregate([
        {
          $group: {
            _id: "$level",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      total: 0,
      N5: 0,
      N4: 0,
      N3: 0,
      N2: 0,
      N1: 0,
    };

    statsAggregation.forEach((s) => {
      if (stats[s._id] !== undefined) {
        stats[s._id] = s.count;
      }
      stats.total += s.count;
    });

    return successResponse(
      res,
      {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        stats,
      },
      "Lấy danh sách từ vựng thành công!"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/vocabulary
 * Create a single system vocabulary word
 */
export const createAdminVocabulary = async (req, res, next) => {
  try {
    const { kanji, furigana, romaji, meaning, level, wordType, exampleSentence, exampleTranslation, tags, source } = req.body;

    if (!kanji || !meaning) {
      return errorResponse(res, "Vui lòng nhập từ tiếng Nhật và nghĩa.", 400);
    }

    const item = await SystemVocabulary.create({
      kanji: kanji.trim(),
      furigana: (furigana || "").trim(),
      romaji: (romaji || "").trim(),
      meaning: meaning.trim(),
      level: level || "N5",
      wordType: wordType || "phrase",
      exampleSentence: (exampleSentence || "").trim(),
      exampleTranslation: (exampleTranslation || "").trim(),
      tags: tags || ["jtalk"],
      source: (source || "JTalk Master Bank").trim(),
      createdBy: req.user?._id,
    });

    return successResponse(res, item, "Đã thêm từ vựng mới vào kho hệ thống!");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/vocabulary/:id
 * Update a single system vocabulary word
 */
export const updateAdminVocabulary = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID từ vựng không hợp lệ.", 400);
    }

    const updated = await SystemVocabulary.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return errorResponse(res, "Không tìm thấy từ vựng để cập nhật.", 404);
    }

    return successResponse(res, updated, "Đã cập nhật từ vựng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/vocabulary/:id
 * Delete a single system vocabulary word
 */
export const deleteAdminVocabulary = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "ID từ vựng không hợp lệ.", 400);
    }

    const deleted = await SystemVocabulary.findByIdAndDelete(id);
    if (!deleted) {
      return errorResponse(res, "Không tìm thấy từ vựng để xóa.", 404);
    }

    return successResponse(res, null, "Đã xóa từ vựng thành công!");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/vocabulary/bulk
 * Delete multiple vocabularies by IDs or by Level
 */
export const deleteAdminVocabularyBulk = async (req, res, next) => {
  try {
    const { ids, level } = req.body;

    if (level && ["N5", "N4", "N3", "N2", "N1"].includes(level)) {
      const result = await SystemVocabulary.deleteMany({ level });
      return successResponse(
        res,
        { deletedCount: result.deletedCount },
        `Đã xóa toàn bộ ${result.deletedCount} từ vựng thuộc cấp độ ${level}!`
      );
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
      const result = await SystemVocabulary.deleteMany({ _id: { $in: validIds } });
      return successResponse(
        res,
        { deletedCount: result.deletedCount },
        `Đã xóa ${result.deletedCount} từ vựng được chọn!`
      );
    }

    return errorResponse(res, "Vui lòng chọn danh sách ID hoặc cấp độ (level) cần xóa.", 400);
  } catch (error) {
    next(error);
  }
};
