import api from "@/services/api";

export interface DailyStudyLog {
  day: string;
  date: string;
  minutesSpent: number;
  practiceCount: number;
  xpEarned: number;
  lessonsCompleted?: number;
}

export const studylogService = {
  getWeeklyLogs: async (): Promise<DailyStudyLog[]> => {
    try {
      const res = await api.get("/studylogs/weekly");
      return res.data?.weeklyData || res.data?.data || [];
    } catch (err) {
      console.error("Lỗi khi tải weekly studylogs:", err);
      return [];
    }
  },
};

export default studylogService;
