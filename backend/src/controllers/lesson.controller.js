// @ts-nocheck
import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";

// GET /api/lessons
export const getLessons = async (req, res) => {
  try {
    const { topicId, level } = req.query;
    const filter = { isPublished: true };

    if (topicId) {
      if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({ message: "topicId không hợp lệ" });
      }
      filter.topicId = topicId;
    }

    if (level && level !== "Tất cả") {
      filter.level = level;
    }

    const lessons = await Lesson.find(filter)
      .populate("topicId", "name level")
      .sort({ createdAt: -1 });

    return res.status(200).json({ lessons });
  } catch (error) {
    console.error("Lỗi khi gọi getLessons:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// GET /api/lessons/:id
export const getLessonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Lesson ID không hợp lệ" });
    }

    const lesson = await Lesson.findById(id).populate("topicId", "name level");

    if (!lesson) {
      return res.status(404).json({ message: "Không tìm thấy Bài học" });
    }

    return res.status(200).json({ lesson });
  } catch (error) {
    console.error("Lỗi khi gọi getLessonById:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// POST /api/lessons
export const createLesson = async (req, res) => {
  try {
    const {
      topicId,
      title,
      description,
      level,
      sampleSentence,
      translation,
      image,
      duration,
      isPublished,
    } = req.body;

    if (!topicId || !title || !sampleSentence) {
      return res.status(400).json({
        message: "Không thể thiếu topicId, title hoặc sampleSentence",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "topicId không hợp lệ" });
    }

    const lesson = await Lesson.create({
      topicId,
      title,
      description: description || "",
      level: level || "N5",
      sampleSentence,
      translation: translation || "",
      image: image || "",
      duration: duration || "10 phút",
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    return res.status(201).json({ lesson });
  } catch (error) {
    console.error("Lỗi khi gọi createLesson:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PATCH /api/lessons/:id
export const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Lesson ID không hợp lệ" });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({ message: "Không tìm thấy Bài học" });
    }

    const {
      topicId,
      title,
      description,
      level,
      sampleSentence,
      translation,
      image,
      duration,
      isPublished,
    } = req.body;

    if (topicId) {
      if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({ message: "topicId không hợp lệ" });
      }
      lesson.topicId = topicId;
    }

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (level !== undefined) lesson.level = level;
    if (sampleSentence !== undefined) lesson.sampleSentence = sampleSentence;
    if (translation !== undefined) lesson.translation = translation;
    if (image !== undefined) lesson.image = image;
    if (duration !== undefined) lesson.duration = duration;
    if (isPublished !== undefined) lesson.isPublished = isPublished;

    await lesson.save();

    return res.status(200).json({ lesson });
  } catch (error) {
    console.error("Lỗi khi gọi updateLesson:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// DELETE /api/lessons/:id
export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Lesson ID không hợp lệ" });
    }

    const lesson = await Lesson.findById(id);

    if (!lesson) {
      return res.status(404).json({ message: "Không tìm thấy Bài học" });
    }

    await Lesson.deleteOne({ _id: id });

    return res.status(200).json({ message: "Xoá Bài học thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi deleteLesson:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
