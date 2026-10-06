import api from "@/services/api";
import type { User, UserProfile } from "@/types";

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

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  currentUser?: LeaderboardUser | null;
  timeframe: "all" | "week" | "month";
  type: "xp" | "streak";
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
  profile?: Partial<UserProfile>;
  targetLevel?: "N5" | "N4" | "N3" | "N2" | "N1";
  goal?: "daily_conversation" | "interview" | "business" | "travel";
  dailyTargetMinutes?: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  getLeaderboard: async (
    type: "xp" | "streak" = "xp",
    timeframe: "all" | "week" | "month" = "all",
    limit = 25
  ): Promise<LeaderboardResponse> => {
    try {
      const res = await api.get(
        `/users/leaderboard?type=${type}&timeframe=${timeframe}&limit=${limit}`
      );
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) {
        return {
          leaderboard: data,
          currentUser: null,
          timeframe,
          type,
        };
      }
      return {
        leaderboard: data?.leaderboard || [],
        currentUser: data?.currentUser || null,
        timeframe: data?.timeframe || timeframe,
        type: data?.type || type,
      };
    } catch (err) {
      console.error("Lỗi khi tải bảng xếp hạng:", err);
      return {
        leaderboard: [],
        currentUser: null,
        timeframe,
        type,
      };
    }
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await api.patch("/users/me", payload);
    return res.data?.data || res.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch("/users/change-password", payload);
    return res.data;
  },
};

export default userService;
