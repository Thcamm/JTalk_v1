import api from "@/lib/axios";
import type { Practice } from "@/types";

export const practiceService = {
  createPractice: async (lessonId: string, sampleSentence: string): Promise<Practice> => {
    const res = await api.post("/practices", { lessonId, sampleSentence });
    return res.data.practice;
  },

  getPractices: async (): Promise<Practice[]> => {
    const res = await api.get("/practices");
    return res.data.practices;
  },

  getPracticeById: async (id: string): Promise<Practice> => {
    const res = await api.get(`/practices/${id}`);
    return res.data.practice;
  },

  updatePractice: async (id: string, data: Partial<Practice>): Promise<Practice> => {
    const res = await api.patch(`/practices/${id}`, data);
    return res.data.practice;
  },

  deletePractice: async (id: string): Promise<Practice> => {
    const res = await api.delete(`/practices/${id}`);
    return res.data;
  },
};
