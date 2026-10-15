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
    totalSystemVocabularies?: number;
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
  courseId?: string;
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
  courseId?: string;
  topicId: string;
  title: string;
  description?: string;
  level?: string;
  orderIndex?: number;
  episodeNumber?: number;
  lessonType?: string;
  youtubeId?: string;
  videoUrl?: string;
  sourceType?: "community" | "jtalk";
  channelName?: string;
  channelUrl?: string;
  subtitles?: VideoSubtitle[];
  duration?: string;
  durationMinutes?: number;
  isPremiumOnly?: boolean;
  isPublished?: boolean;
  sampleSentence?: string;
  translation?: string;
}

export interface SystemVocabItem {
  _id: string;
  kanji: string;
  furigana: string;
  romaji: string;
  meaning: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  wordType: "noun" | "verb" | "adjective" | "adverb" | "phrase" | "other";
  exampleSentence?: string;
  exampleTranslation?: string;
  source?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminVocabResponse {
  items: SystemVocabItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    N5: number;
    N4: number;
    N3: number;
    N2: number;
    N1: number;
  };
}

export interface ImportVocabPayload {
  items: Array<{
    kanji: string;
    furigana?: string;
    romaji?: string;
    meaning: string;
    level?: string;
    wordType?: string;
    exampleSentence?: string;
    exampleTranslation?: string;
    source?: string;
    tags?: string[];
  }>;
  defaultLevel?: string;
  overwrite?: boolean;
  tags?: string[];
  source?: string;
}

export interface ImportVocabResult {
  totalReceived: number;
  totalValid: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
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

  // 8. Clean redundant / duplicate Sambon Juku videos & restore Minna
  cleanDuplicateVideos: async (): Promise<{
    restoredMinnaCount: number;
    deletedDuplicatesCount: number;
  }> => {
    const res = await api.post<{
      data: {
        restoredMinnaCount: number;
        deletedDuplicatesCount: number;
      };
    }>("/admin/clean-duplicate-videos");
    return res.data.data;
  },

  // 9. Vocabulary & Master Bank Bulk Management
  getVocabularies: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
  }): Promise<AdminVocabResponse> => {
    const res = await api.get<{ data: AdminVocabResponse }>("/admin/vocabulary", { params });
    return res.data.data;
  },

  enrichVocabularyWithAi: async (
    items: Array<{ id?: string; kanji: string; furigana?: string; meaning: string }>
  ): Promise<any[]> => {
    const res = await api.post<{ data: any[] }>("/admin/vocabulary/ai-enrich", { items });
    return res.data.data;
  },

  importVocabularies: async (payload: ImportVocabPayload): Promise<ImportVocabResult> => {
    const res = await api.post<{ data: ImportVocabResult }>("/admin/vocabulary/import", payload);
    return res.data.data;
  },

  importVocabulariesToLesson: async (payload: {
    lessonId: string;
    items: Array<{ kanji: string; word?: string; meaning: string; romaji?: string }>;
    replaceExisting?: boolean;
  }): Promise<{ lessonId: string; title: string; totalVocabulary: number }> => {
    const res = await api.post<{
      data: { lessonId: string; title: string; totalVocabulary: number };
    }>("/admin/vocabulary/import-to-lesson", payload);
    return res.data.data;
  },

  createVocabulary: async (payload: Partial<SystemVocabItem>): Promise<SystemVocabItem> => {
    const res = await api.post<{ data: SystemVocabItem }>("/admin/vocabulary", payload);
    return res.data.data;
  },

  updateVocabulary: async (
    id: string,
    payload: Partial<SystemVocabItem>
  ): Promise<SystemVocabItem> => {
    const res = await api.patch<{ data: SystemVocabItem }>(`/admin/vocabulary/${id}`, payload);
    return res.data.data;
  },

  deleteVocabulary: async (id: string): Promise<void> => {
    await api.delete(`/admin/vocabulary/${id}`);
  },

  deleteVocabulariesBulk: async (payload: {
    ids?: string[];
    level?: string;
  }): Promise<{ deletedCount: number }> => {
    const res = await api.delete<{ data: { deletedCount: number } }>("/admin/vocabulary/bulk", {
      data: payload,
    });
    return res.data.data;
  },
};
