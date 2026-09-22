import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import type { AuthState } from "@/types";

const getTodayStr = () => new Date().toISOString().split("T")[0];

const getLocalDailyCount = (): number => {
  try {
    const today = getTodayStr();
    return Number(localStorage.getItem(`jtalk_practice_count_${today}`)) || 0;
  } catch (_) {
    return 0;
  }
};

const setLocalDailyCount = (count: number): void => {
  try {
    const today = getTodayStr();
    localStorage.setItem(`jtalk_practice_count_${today}`, String(count));
  } catch (_) {}
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,
  dailyPracticeCount: getLocalDailyCount(),

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },

  incrementDailyPracticeCount: () => {
    const nextCount = get().dailyPracticeCount + 1;
    setLocalDailyCount(nextCount);

    const currentUser = get().user;
    if (currentUser) {
      set({
        dailyPracticeCount: nextCount,
        user: {
          ...currentUser,
          dailyUsage: {
            ...currentUser.dailyUsage,
            date: getTodayStr(),
            practiceCount: nextCount,
            minutesSpent: (currentUser.dailyUsage?.minutesSpent || 0) + 1,
          },
          quota: {
            ...currentUser.quota,
            usedToday: nextCount,
            remaining:
              currentUser.subscription?.tier === "premium"
                ? "unlimited"
                : Math.max(0, 2 - nextCount),
          },
        },
      });
    } else {
      set({ dailyPracticeCount: nextCount });
    }
  },

  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true });
      await authService.signUp(username, password, email, firstName, lastName);
      toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.");
    } catch (error) {
      console.error(error);
      toast.error("Đăng ký không thành công");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (username, password) => {
    try {
      set({ loading: true });

      const { accessToken } = await authService.signIn(username, password);
      get().setAccessToken(accessToken);

      await get().fetchMe();

      toast.success("Chào mừng bạn quay lại với JTalk AI");
    } catch (error) {
      console.error(error);
      toast.error("Đăng nhập không thành công!");
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      toast.success("Logout thành công!");
    } catch (error) {
      console.error(error);
    } finally {
      get().clearState();
    }
  },

  fetchMe: async () => {
    try {
      set({ loading: true });
      const user = await authService.fetchMe();
      if (user) {
        const serverUsedToday = user.dailyUsage?.practiceCount ?? user.quota?.usedToday ?? 0;
        const localCount = getLocalDailyCount();
        const combinedCount = Math.max(serverUsedToday, localCount);
        setLocalDailyCount(combinedCount);

        set({
          user: {
            ...user,
            dailyUsage: {
              ...user.dailyUsage,
              date: getTodayStr(),
              practiceCount: combinedCount,
            },
            quota: {
              ...user.quota,
              usedToday: combinedCount,
              remaining:
                user.subscription?.tier === "premium"
                  ? "unlimited"
                  : Math.max(0, 2 - combinedCount),
            },
          },
          dailyPracticeCount: combinedCount,
        });
      } else {
        set({ user: null });
      }
    } catch (error) {
      console.error(error);
      set({ user: null, accessToken: null });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const accessToken = await authService.refresh();
      get().setAccessToken(accessToken);
      const user = await authService.fetchMe();
      if (user) {
        const serverUsedToday = user.dailyUsage?.practiceCount ?? user.quota?.usedToday ?? 0;
        const localCount = getLocalDailyCount();
        const combinedCount = Math.max(serverUsedToday, localCount);
        setLocalDailyCount(combinedCount);

        set({
          user: {
            ...user,
            dailyUsage: {
              ...user.dailyUsage,
              date: getTodayStr(),
              practiceCount: combinedCount,
            },
            quota: {
              ...user.quota,
              usedToday: combinedCount,
              remaining:
                user.subscription?.tier === "premium"
                  ? "unlimited"
                  : Math.max(0, 2 - combinedCount),
            },
          },
          dailyPracticeCount: combinedCount,
        });
      } else {
        set({ user: null });
      }
    } catch (error) {
      get().clearState();
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateUserGamification: (gamification) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          gamification: {
            ...currentUser.gamification,
            ...gamification,
            streak: gamification.streak ?? currentUser.gamification?.streak ?? 0,
            longestStreak: gamification.longestStreak ?? currentUser.gamification?.longestStreak ?? 0,
            totalXp: gamification.totalXp ?? currentUser.gamification?.totalXp ?? 0,
            level: gamification.level ?? currentUser.gamification?.level ?? 1,
          },
        },
      });
    }
  },

  updateUserDailyUsage: (dailyUsage) => {
    const newCount = dailyUsage.practiceCount ?? get().dailyPracticeCount;
    setLocalDailyCount(newCount);
    const currentUser = get().user;
    if (currentUser) {
      set({
        dailyPracticeCount: newCount,
        user: {
          ...currentUser,
          dailyUsage: {
            ...currentUser.dailyUsage,
            ...dailyUsage,
            date: getTodayStr(),
            practiceCount: newCount,
            minutesSpent: dailyUsage.minutesSpent ?? currentUser.dailyUsage?.minutesSpent ?? 0,
          },
          quota: {
            ...currentUser.quota,
            usedToday: newCount,
            remaining:
              currentUser.subscription?.tier === "premium"
                ? "unlimited"
                : Math.max(0, 2 - newCount),
          },
        },
      });
    } else {
      set({ dailyPracticeCount: newCount });
    }
  },

  updateUserSubscription: (subscription) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          subscription: {
            ...currentUser.subscription,
            ...subscription,
            tier: subscription.tier ?? currentUser.subscription?.tier ?? "free",
          },
        },
      });
    }
  },
}));
