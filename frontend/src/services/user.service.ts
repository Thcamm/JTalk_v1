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
  league?: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  zone?: "promotion" | "safe" | "demotion";
}

export interface LeagueInfo {
  currentLeague: string;
  weekEndsAt: string;
  promotionTop: number;
  demotionThreshold: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  currentUser?: LeaderboardUser | null;
  timeframe: "all" | "week" | "month";
  type: "xp" | "streak";
  leagueInfo?: LeagueInfo;
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

export interface ClaimQuestResponse {
  success: boolean;
  message?: string;
  alreadyClaimed?: boolean;
  totalXp?: number;
  level?: number;
  xpEarned?: number;
  questId?: string;
}

export interface ClaimPracticeBonusResponse {
  success: boolean;
  earnedBonusPractices: number;
  maxBonus: number;
  limit: number;
  vocabReviewsToday: number;
  message: string;
}

export interface OnboardingQuizPayload {
  targetLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  goal: "daily_conversation" | "interview" | "business" | "travel";
  dailyTargetMinutes: number;
  occupation?: "student" | "working" | "other";
}

export interface OnboardingQuizResponse {
  success: boolean;
  isFirstTime: boolean;
  xpEarned: number;
  totalXp: number;
  level: number;
  message: string;
  profile: UserProfile;
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
        leagueInfo: data?.leagueInfo,
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

  claimQuestReward: async (payload: {
    questId: string;
    xpReward?: number;
    questType?: "daily" | "weekly";
    date?: string;
  }): Promise<ClaimQuestResponse> => {
    const res = await api.post("/users/claim-quest", {
      questId: payload.questId,
      xpReward: payload.xpReward ?? 30,
      questType: payload.questType ?? "daily",
      date: payload.date || new Date().toISOString().split("T")[0],
    });
    return res.data;
  },

  claimPracticeBonus: async (): Promise<ClaimPracticeBonusResponse> => {
    const res = await api.post("/users/claim-practice-bonus");
    return res.data?.data || res.data;
  },

  completeOnboardingQuiz: async (
    payload: OnboardingQuizPayload
  ): Promise<OnboardingQuizResponse> => {
    const res = await api.post("/users/onboarding-quiz", payload);
    return res.data?.data || res.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
    const res = await api.patch("/users/me", payload);
    return res.data?.data || res.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const res = await api.patch("/users/change-password", payload);
    return res.data;
  },

  buyStreakFreeze: async (): Promise<{
    success: boolean;
    equipped: number;
    totalXp: number;
    level: number;
    message: string;
  }> => {
    const res = await api.post("/users/buy-streak-freeze");
    return res.data?.data || res.data;
  },
};

export default userService;
