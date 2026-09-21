import api from "@/lib/axios";
import type { Lesson } from "@/types";

export const lessonService = {
  getLessons: async (topicId?: string, level?: string): Promise<Lesson[]> => {
    const params: Record<string, string> = {};
    if (topicId) params.topicId = topicId;
    if (level) params.level = level;

    const res = await api.get("/lessons", { params });
    return res.data.lessons;
  },

  getLessonById: async (id: string): Promise<Lesson> => {
    const res = await api.get(`/lessons/${id}`);
    return res.data.lesson;
  },

  createLesson: async (data: Partial<Lesson>): Promise<Lesson> => {
    const res = await api.post("/lessons", data);
    return res.data.lesson;
  },

  updateLesson: async (id: string, data: Partial<Lesson>): Promise<Lesson> => {
    const res = await api.patch(`/lessons/${id}`, data);
    return res.data.lesson;
  },

  deleteLesson: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/lessons/${id}`);
    return res.data;
  },
};
