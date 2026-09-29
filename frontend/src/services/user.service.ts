import api from "@/services/api";

export interface LeaderboardUser {
  rank: number;
  _id: string;
  displayName: string;
  avatarUrl?: string;
  targetLevel: string;
  totalXp: number;
  streak: number;
  level: number;
  isPremium?: boolean;
}

export const userService = {
  getLeaderboard: async (type: "xp" | "streak" = "xp", limit = 20): Promise<LeaderboardUser[]> => {
    try {
      const res = await api.get(`/users/leaderboard?type=${type}&limit=${limit}`);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Lỗi khi tải bảng xếp hạng:", err);
      return [];
    }
  },
};

export default userService;
