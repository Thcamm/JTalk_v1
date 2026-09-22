import { useAuthStore } from "@/stores/useAuthStore";
import { useMemo } from "react";

export const useAuth = () => {
  const {
    user,
    loading,
    accessToken,
    dailyPracticeCount,
    incrementDailyPracticeCount,
    signIn,
    signUp,
    signOut,
    fetchMe,
    refresh,
    updateUserGamification,
    updateUserDailyUsage,
    updateUserSubscription,
  } = useAuthStore();

  const isAuthenticated = useMemo(() => {
    return !!accessToken && !!user;
  }, [accessToken, user]);

  const isPremium = useMemo(() => {
    if (!user || !user.subscription) return false;
    const { tier, expiresAt } = user.subscription;
    if (tier !== "premium") return false;
    if (expiresAt) {
      return new Date(expiresAt).getTime() > Date.now();
    }
    return true;
  }, [user]);

  const streak = useMemo(() => {
    return user?.gamification?.streak || 0;
  }, [user]);

  const xp = useMemo(() => {
    return user?.gamification?.totalXp || 0;
  }, [user]);

  const practiceCountToday = useMemo(() => {
    const userCount = user?.dailyUsage?.practiceCount ?? user?.quota?.usedToday ?? 0;
    return Math.max(userCount, dailyPracticeCount);
  }, [user, dailyPracticeCount]);

  const remainingFreePractices = useMemo(() => {
    if (isPremium) return 999;
    return Math.max(0, 2 - practiceCountToday);
  }, [isPremium, practiceCountToday]);

  return {
    user,
    loading,
    accessToken,
    isAuthenticated,
    isPremium,
    streak,
    xp,
    practiceCountToday,
    remainingFreePractices,
    dailyPracticeCount,
    incrementDailyPracticeCount,
    signIn,
    signUp,
    signOut,
    fetchMe,
    refresh,
    updateUserGamification,
    updateUserDailyUsage,
    updateUserSubscription,
  };
};

export default useAuth;
