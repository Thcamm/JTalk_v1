// @ts-nocheck
import mongoose from "mongoose";
import Practice from "../models/Practice.js";
import Lesson from "../models/Lesson.js";

const VALID_STATUSES = ["pending", "processing", "completed", "failed"];

// POST /api/practices
export const createPractice = async (req, res) => {
  try {
    const { lessonId, sampleSentence, audioUrl, transcript } = req.body;
    const userId = req.user._id;

    if (!lessonId) {
      return res.status(400).json({
        message: "Thiếu lessonId",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        message: "lessonId không hợp lệ",
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Bài học không tồn tại",
      });
    }

    const sentenceToUse = sampleSentence || lesson.sampleSentence;

    const newPractice = await Practice.create({
      userId,
      lessonId,
      sampleSentence: sentenceToUse,
      audioUrl: audioUrl || "",
      transcript: transcript || "",
      status: "pending",
    });

    const practice = await Practice.findById(newPractice._id).populate(
      "lessonId",
      "title sampleSentence translation level duration"
    );

    return res.status(201).json({ practice });
  } catch (error) {
    console.error("Lỗi khi gọi createPractice:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// GET /api/practices
export const getPractices = async (req, res) => {
  try {
    const userId = req.user._id;
    const practices = await Practice.find({ userId })
      .populate("lessonId", "title sampleSentence translation level duration")
      .sort({ createdAt: -1 });

    return res.status(200).json({ practices });
  } catch (error) {
    console.error("Lỗi khi gọi getPractices:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// GET /api/practices/:id
export const getPracticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Practice ID không hợp lệ" });
    }

    const practice = await Practice.findById(id).populate(
      "lessonId",
      "title sampleSentence translation level duration"
    );

    if (!practice || practice.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Bài luyện tập không tồn tại" });
    }

    return res.status(200).json({ practice });
  } catch (error) {
    console.error("Lỗi khi gọi getPracticeById:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PATCH /api/practices/:id
export const updatePractice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Practice ID không hợp lệ" });
    }

    const { audioUrl, transcript, score, status, completedAt } = req.body;

    const practice = await Practice.findById(id);

    if (!practice || practice.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Bài luyện tập không tồn tại" });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    if (audioUrl !== undefined) practice.audioUrl = audioUrl;
    if (transcript !== undefined) practice.transcript = transcript;
    if (score !== undefined) practice.score = score;
    if (status !== undefined) practice.status = status;
    if (completedAt !== undefined) practice.completedAt = completedAt;

    await practice.save();

    const updatedPractice = await Practice.findById(id).populate(
      "lessonId",
      "title sampleSentence translation level duration"
    );

    return res.status(200).json({ practice: updatedPractice });
  } catch (error) {
    console.error("Lỗi khi gọi updatePractice:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// DELETE /api/practices/:id
export const deletePractice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Practice ID không hợp lệ" });
    }

    const practice = await Practice.findById(id);

    if (!practice || practice.userId.toString() !== userId.toString()) {
      return res.status(404).json({ message: "Bài luyện tập không tồn tại" });
    }

    await Practice.deleteOne({ _id: id, userId });

    return res.status(200).json({ message: "Xoá bài luyện tập thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi deletePractice:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
