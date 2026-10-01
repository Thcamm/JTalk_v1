import { api } from "./api";
import type { User, Lesson, Course, Topic, VideoSubtitle } from "@/types";

export interface AdminStatsResponse {
  kpi: {
    totalUsers: number;
    totalAdmins: number;
    totalPremiumUsers: number;
    totalCourses: number;
    totalTopics: number;
    totalLessons: number;
    totalVideoLessons: number;
    totalPractices: number;
  };
  recentUsers: User[];
  recentLessons: Array<{
    _id: string;
    title: string;
    level: string;
    youtubeId?: string;
    isPublished: boolean;
    duration: string;
    createdAt: string;
    topicId?: {
      _id: string;
      name: string;
    };
  }>;
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: "user" | "admin";
  tier?: "free" | "premium";
  level?: string;
}

export interface AdminUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminLessonsQuery {
  page?: number;
  limit?: number;
  search?: string;
  topicId?: string;
  level?: string;
  isPublished?: boolean | string;
  hasVideo?: boolean | string;
}

export interface AdminLessonsResponse {
  lessons: Array<Lesson & {
    topicId?: {
      _id: string;
      name: string;
      courseId?: {
        _id: string;
        title: string;
      };
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateLessonPayload {
  topicId: string;
  title: string;
  description?: string;
  level?: string;
  youtubeId?: string;
  videoUrl?: string;
  channelName?: string;
  subtitles?: VideoSubtitle[];
  duration?: string;
  durationMinutes?: number;
  isPremiumOnly?: boolean;
  isPublished?: boolean;
  sampleSentence?: string;
  translation?: string;
}

export const adminService = {
  // 1. Overview KPIs
  getStats: async (): Promise<AdminStatsResponse> => {
    const res = await api.get<{ data: AdminStatsResponse }>("/admin/stats");
    return res.data.data;
  },

  // 2. User Management
  getUsers: async (params?: AdminUsersQuery): Promise<AdminUsersResponse> => {
    const res = await api.get<{ data: AdminUsersResponse }>("/admin/users", { params });
    return res.data.data;
  },

  updateUserRole: async (userId: string, role: "user" | "admin"): Promise<User> => {
    const res = await api.patch<{ data: User }>(`/admin/users/${userId}/role`, { role });
    return res.data.data;
  },

  updateUserSubscription: async (
    userId: string,
    tier: "free" | "premium",
    durationDays: number = 30
  ): Promise<User> => {
    const res = await api.patch<{ data: User }>(`/admin/users/${userId}/subscription`, {
      tier,
      durationDays,
    });
    return res.data.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  // 3. Lesson & Video Management
  getLessons: async (params?: AdminLessonsQuery): Promise<AdminLessonsResponse> => {
    const res = await api.get<{ data: AdminLessonsResponse }>("/admin/lessons", { params });
    return res.data.data;
  },

  createLesson: async (payload: CreateLessonPayload): Promise<Lesson> => {
    const res = await api.post<{ data: Lesson }>("/admin/lessons", payload);
    return res.data.data;
  },

  updateLesson: async (
    lessonId: string,
    payload: Partial<CreateLessonPayload>
  ): Promise<Lesson> => {
    const res = await api.patch<{ data: Lesson }>(`/admin/lessons/${lessonId}`, payload);
    return res.data.data;
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    await api.delete(`/admin/lessons/${lessonId}`);
  },

  // 4. Course Management
  getCourses: async (): Promise<Course[]> => {
    const res = await api.get<{ data: Course[] }>("/admin/courses");
    return res.data.data;
  },

  createCourse: async (payload: Partial<Course>): Promise<Course> => {
    const res = await api.post<{ data: Course }>("/admin/courses", payload);
    return res.data.data;
  },

  updateCourse: async (courseId: string, payload: Partial<Course>): Promise<Course> => {
    const res = await api.patch<{ data: Course }>(`/admin/courses/${courseId}`, payload);
    return res.data.data;
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/admin/courses/${courseId}`);
  },

  // 5. Topic Management
  getTopics: async (courseId?: string): Promise<Topic[]> => {
    const res = await api.get<{ data: Topic[] }>("/admin/topics", {
      params: courseId ? { courseId } : undefined,
    });
    return res.data.data;
  },

  createTopic: async (payload: Partial<Topic>): Promise<Topic> => {
    const res = await api.post<{ data: Topic }>("/admin/topics", payload);
    return res.data.data;
  },

  // 6. YouTube Transcript Extractor
  getYoutubeTranscript: async (
    urlOrVideoId: string
  ): Promise<{
    videoId: string;
    title: string;
    channelName: string;
    duration: string;
    language: string;
    subtitles: VideoSubtitle[];
  }> => {
    const res = await api.get<{
      data: {
        videoId: string;
        title: string;
        channelName: string;
        duration: string;
        language: string;
        subtitles: VideoSubtitle[];
      };
    }>("/admin/youtube/transcript", {
      params: { url: urlOrVideoId },
    });
    return res.data.data;
  },

  // 7. AI Subtitle Enrichment (Furigana, Romaji, Vietnamese translation)
  enrichSubtitles: async (subtitles: VideoSubtitle[]): Promise<VideoSubtitle[]> => {
    const res = await api.post<{ data: VideoSubtitle[] }>("/admin/subtitles/enrich", {
      subtitles,
    });
    return res.data.data;
  },
};
