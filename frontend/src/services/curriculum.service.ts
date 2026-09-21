import api from "@/services/api";
import type { Course, Topic, Lesson } from "@/types";

export const curriculumService = {
  // Courses
  getCourses: async (): Promise<Course[]> => {
    const res = await api.get("/courses");
    return res.data?.courses || res.data?.data || [];
  },

  getCourseById: async (id: string): Promise<Course> => {
    const res = await api.get(`/courses/${id}`);
    return res.data?.course || res.data?.data;
  },

  getCourseTopics: async (courseId: string): Promise<Topic[]> => {
    const res = await api.get(`/courses/${courseId}/topics`);
    return res.data?.topics || res.data?.data || [];
  },

  // Topics
  getTopics: async (level?: string): Promise<Topic[]> => {
    const res = await api.get("/topics", {
      params: level ? { level } : undefined,
    });
    return res.data?.topics || res.data?.data || [];
  },

  getTopicById: async (id: string): Promise<Topic> => {
    const res = await api.get(`/topics/${id}`);
    return res.data?.topic || res.data?.data;
  },

  getTopicLessons: async (topicId: string): Promise<Lesson[]> => {
    const res = await api.get(`/topics/${topicId}/lessons`);
    return res.data?.lessons || res.data?.data || [];
  },

  // Lessons
  getLessons: async (params?: { topicId?: string; level?: string }): Promise<Lesson[]> => {
    const res = await api.get("/lessons", { params });
    return res.data?.lessons || res.data?.data || [];
  },

  getLessonById: async (id: string): Promise<Lesson> => {
    const res = await api.get(`/lessons/${id}`);
    return res.data?.lesson || res.data?.data;
  },
};

export default curriculumService;
