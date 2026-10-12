import api from "@/services/api";

export interface DailyStudyLog {
  day: string;
  date: string;
  minutesSpent: number;
  practiceCount: number;
  xpEarned: number;
  lessonsCompleted?: number;
  checkedIn?: boolean;
}

export interface CheckInResponse {
  success: boolean;
  message?: string;
  streak?: number;
  longestStreak?: number;
  totalXp?: number;
  level?: number;
  xpEarned?: number;
  alreadyCheckedIn?: boolean;
  isStreakIncremented?: boolean;
  date?: string;
  weeklyData?: DailyStudyLog[];
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

  checkIn: async (date?: string): Promise<CheckInResponse> => {
    const res = await api.post("/studylogs/checkin", {
      date: date || new Date().toISOString().split("T")[0],
    });
    return res.data;
  },
};

export default studylogService;
