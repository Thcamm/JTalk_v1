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

  signUp: async (username, password, email, firstName, lastName, displayName) => {
    try {
      get().clearState();
      set({ loading: true });
      const res = await authService.signUp(username, password, email, firstName, lastName, displayName);

      // Auto login if backend returned access token
      if (res?.accessToken) {
        get().setAccessToken(res.accessToken);
        if (res.user) {
          set({ user: res.user });
        }
        await get().fetchMe();
        const welcomeName = get().user?.displayName || res.user?.displayName || username;
        toast.success(`Đăng ký thành công! Chào mừng ${welcomeName} gia nhập JTalk AI.`);
      } else {
        toast.success("Đăng ký tài khoản thành công!");
      }
      return res;
    } catch (error: any) {
      console.error("Sign up error:", error);
      const msg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra lại kết nối mạng hoặc server Render."
          : "Đăng ký không thành công");
      toast.error(msg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (username, password) => {
    try {
      get().clearState();
      set({ loading: true });

      const res = await authService.signIn(username, password);
      const accessToken = res?.accessToken;
      const loggedInUser = res?.user;

      if (accessToken) {
        get().setAccessToken(accessToken);
      }
      if (loggedInUser) {
        set({ user: loggedInUser });
      }

      await get().fetchMe();

      const welcomeName = get().user?.displayName || loggedInUser?.displayName || username;
      toast.success(`Chào mừng ${welcomeName} quay lại với JTalk AI`);
    } catch (error: any) {
      console.error("Sign in error:", error);
      const msg =
        error.response?.data?.message ||
        (error.message === "Network Error"
          ? "Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra lại URL API hoặc server Render."
          : "Đăng nhập không thành công!");
      toast.error(msg);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      toast.success("Đăng xuất thành công!");
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
                  : Math.max(0, 5 - combinedCount),
            },
          },
          dailyPracticeCount: combinedCount,
        });
      } else {
        set({ user: null });
      }
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.status !== 401) {
        console.error("fetchMe error:", error);
      }
      set({ user: null, accessToken: null });
    } finally {
      set({ loading: false });
    }
  },

  initSession: async () => {
    if (get().accessToken && get().user) return;
    try {
      const accessToken = await authService.refresh();
      if (accessToken) {
        get().setAccessToken(accessToken);
        await get().fetchMe();
      }
    } catch {
      // Guest or expired session: clean state silently
      get().clearState();
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
                  : Math.max(0, 5 - combinedCount),
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

  updateUser: (fields) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          ...fields,
        },
      });
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
            streakFreeze: gamification.streakFreeze ?? currentUser.gamification?.streakFreeze,
            league: gamification.league ?? currentUser.gamification?.league,
            onboardingCompleted: gamification.onboardingCompleted ?? currentUser.gamification?.onboardingCompleted,
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
      const currentLimit = typeof currentUser.quota?.limit === "number" ? currentUser.quota.limit : 5;
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
            earnedBonusPractices: dailyUsage.earnedBonusPractices ?? currentUser.dailyUsage?.earnedBonusPractices ?? 0,
            vocabReviewsToday: dailyUsage.vocabReviewsToday ?? currentUser.dailyUsage?.vocabReviewsToday ?? 0,
          },
          quota: {
            ...currentUser.quota,
            usedToday: newCount,
            remaining:
              currentUser.subscription?.tier === "premium"
                ? "unlimited"
                : Math.max(0, currentLimit - newCount),
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
