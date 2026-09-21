// @ts-nocheck
import mongoose from "mongoose";
import Topic from "../models/Topic.js";

// GET /api/topics
export const getTopics = async (req, res) => {
  try {
    const { level } = req.query;
    const filter = { isPublished: true };

    if (level && level !== "Tất cả") {
      filter.level = level;
    }

    const topics = await Topic.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ topics });
  } catch (error) {
    console.error("Lỗi khi gọi getTopics:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// GET /api/topics/:id
export const getTopicById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Topic ID không hợp lệ" });
    }

    const topic = await Topic.findById(id);

    if (!topic) {
      return res.status(404).json({ message: "Không tìm thấy Topic" });
    }

    return res.status(200).json({ topic });
  } catch (error) {
    console.error("Lỗi khi gọi getTopicById:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// POST /api/topics
export const createTopic = async (req, res) => {
  try {
    const { name, description, level, image, isPublished } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tên topic là bắt buộc" });
    }

    const topic = await Topic.create({
      name,
      description: description || "",
      level: level || "N5",
      image: image || "",
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    return res.status(201).json({ topic });
  } catch (error) {
    console.error("Lỗi khi gọi createTopic:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// PATCH /api/topics/:id
export const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Topic ID không hợp lệ" });
    }

    const topic = await Topic.findById(id);

    if (!topic) {
      return res.status(404).json({ message: "Không tìm thấy Topic" });
    }

    const { name, description, level, image, isPublished } = req.body;

    if (name !== undefined) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (level !== undefined) topic.level = level;
    if (image !== undefined) topic.image = image;
    if (isPublished !== undefined) topic.isPublished = isPublished;

    await topic.save();

    return res.status(200).json({ topic });
  } catch (error) {
    console.error("Lỗi khi gọi updateTopic:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// DELETE /api/topics/:id
export const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Topic ID không hợp lệ" });
    }

    const topic = await Topic.findById(id);

    if (!topic) {
      return res.status(404).json({ message: "Không tìm thấy Topic" });
    }

    await Topic.deleteOne({ _id: id });

    return res.status(200).json({ message: "Xoá Topic thành công" });
  } catch (error) {
    console.error("Lỗi khi gọi deleteTopic:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
