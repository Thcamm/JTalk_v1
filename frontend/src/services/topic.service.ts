import api from "@/lib/axios";
import type { Topic } from "@/types";

export const topicService = {
  getTopics: async (level?: string): Promise<Topic[]> => {
    const params = level ? { level } : {};
    const res = await api.get("/topics", { params });
    return res.data.topics;
  },

  getTopicById: async (id: string): Promise<Topic> => {
    const res = await api.get(`/topics/${id}`);
    return res.data.topic;
  },

  createTopic: async (data: Partial<Topic>): Promise<Topic> => {
    const res = await api.post("/topics", data);
    return res.data.topic;
  },

  updateTopic: async (id: string, data: Partial<Topic>): Promise<Topic> => {
    const res = await api.patch(`/topics/${id}`, data);
    return res.data.topic;
  },

  deleteTopic: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/topics/${id}`);
    return res.data;
  },
};
