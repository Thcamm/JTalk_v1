import Vocabulary from "../models/Vocabulary.js";
import User from "../models/User.js";
import StudyLog from "../models/StudyLog.js";
import { getTodayDateString } from "../utils/dateUtils.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * GET /api/v1/vocabularies
 * Retrieves user's saved vocabulary items with filters
 */
export const getVocabularies = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { level, isMastered, search, isDue } = req.query;

    const query = { userId };

    if (level && level !== "all") {
      query.level = level;
    }

    if (isMastered !== undefined && isMastered !== "all") {
      query.isMastered = isMastered === "true";
    }

    if (isDue === "true") {
      query.$or = [
        { nextReviewDate: { $lte: new Date() } },
        { nextReviewDate: null },
      ];
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchClause = [
        { kanji: searchRegex },
        { furigana: searchRegex },
        { romaji: searchRegex },
        { meaning: searchRegex },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchClause }];
        delete query.$or;
      } else {
        query.$or = searchClause;
      }
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

/**
 * POST /api/v1/vocabularies/:id/srs-review
 * Evaluates vocabulary item using SuperMemo SM-2 Spaced Repetition System
 * Body: { rating: "again" | "hard" | "good" | "easy" }
 */
export const reviewSRS = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { rating } = req.body;

    const item = await Vocabulary.findOne({ _id: id, userId });
    if (!item) {
      const error = new Error("Không tìm thấy từ vựng trong sổ tay.");
      error.statusCode = 404;
      throw error;
    }

    let interval = item.interval || 0;
    let easeFactor = item.easeFactor || 2.5;
    let repetitions = item.repetitions || 0;
    let srsStage = item.srsStage || 0;

    const normalizedRating = String(rating || "good").toLowerCase();

    switch (normalizedRating) {
      case "again":
        repetitions = 0;
        interval = 1;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        srsStage = Math.max(0, srsStage - 1);
        item.isMastered = false;
        break;
      case "hard":
        repetitions += 1;
        interval = repetitions <= 1 ? 1 : Math.max(1, Math.round((interval || 1) * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        srsStage = Math.min(5, Math.max(1, srsStage));
        break;
      case "good":
        repetitions += 1;
        if (repetitions === 1) {
          interval = 1;
        } else if (repetitions === 2) {
          interval = 6;
        } else {
          interval = Math.max(1, Math.round(interval * easeFactor));
        }
        srsStage = Math.min(5, srsStage + 1);
        if (srsStage >= 4) item.isMastered = true;
        break;
      case "easy":
        repetitions += 1;
        if (repetitions === 1) {
          interval = 4;
        } else if (repetitions === 2) {
          interval = 10;
        } else {
          interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
        }
        easeFactor += 0.15;
        srsStage = Math.min(5, srsStage + 1);
        if (srsStage >= 3) item.isMastered = true;
        break;
      default:
        interval = Math.max(1, interval + 1);
        break;
    }

    const nextReviewDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    item.interval = interval;
    item.easeFactor = Number(easeFactor.toFixed(2));
    item.repetitions = repetitions;
    item.srsStage = srsStage;
    item.nextReviewDate = nextReviewDate;
    item.reviewCount = (item.reviewCount || 0) + 1;
    item.lastReviewedAt = new Date();

    await item.save();

    // Reward XP (+5 XP) and record Flashcard review for Practice-to-Earn Quota
    const XP_PER_REVIEW = 5;
    const user = await User.findById(userId);
    let newTotalXp = 0;
    let newLevel = 1;
    let vocabReviewsToday = 0;
    let earnedBonusPractices = 0;

    if (user) {
      const todayStr = getTodayDateString();
      user.dailyUsage = user.dailyUsage || {};
      if (user.dailyUsage.date !== todayStr) {
        user.dailyUsage.date = todayStr;
        user.dailyUsage.practiceCount = 0;
        user.dailyUsage.earnedBonusPractices = 0;
        user.dailyUsage.vocabReviewsToday = 0;
      }
      user.dailyUsage.vocabReviewsToday = (user.dailyUsage.vocabReviewsToday || 0) + 1;
      vocabReviewsToday = user.dailyUsage.vocabReviewsToday;
      earnedBonusPractices = user.dailyUsage.earnedBonusPractices || 0;

      user.gamification = user.gamification || {};
      newTotalXp = (user.gamification.totalXp || 0) + XP_PER_REVIEW;
      newLevel = Math.max(1, Math.floor(newTotalXp / 100) + 1);
      user.gamification.totalXp = newTotalXp;
      user.gamification.level = newLevel;
      await user.save();

      await StudyLog.findOneAndUpdate(
        { userId, date: todayStr },
        { $inc: { xpEarned: XP_PER_REVIEW } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    return successResponse(
      res,
      {
        item,
        srsStage,
        interval,
        nextReviewDate,
        xpEarned: XP_PER_REVIEW,
        totalXp: newTotalXp,
        level: newLevel,
        vocabReviewsToday,
        earnedBonusPractices,
        canClaimBonus: earnedBonusPractices < 2 && vocabReviewsToday >= (earnedBonusPractices + 1) * 5,
      },
      `Đã cập nhật ôn tập SRS (${normalizedRating.toUpperCase()})! +${XP_PER_REVIEW} XP`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/vocabularies/due-count
 * Returns the count of vocabulary items due for review
 */
export const getDueReviewCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const dueCount = await Vocabulary.countDocuments({
      userId,
      $or: [
        { nextReviewDate: { $lte: now } },
        { nextReviewDate: null },
      ],
    });

    return successResponse(res, { dueCount }, "Lấy số lượng từ cần ôn tập thành công!");
  } catch (error) {
    next(error);
  }
};
