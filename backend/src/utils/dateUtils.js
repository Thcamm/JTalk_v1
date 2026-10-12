/**
 * Date and Streak calculation utilities
 */

export const formatDateToString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (clientDate = null) => {
  if (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
    return clientDate;
  }
  return formatDateToString(new Date());
};

export const getYesterdayDateString = (baseDateStr = null) => {
  if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    const [y, m, d] = baseDateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    date.setDate(date.getDate() - 1);
    return formatDateToString(date);
  }
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToString(d);
};

export const getPastNDaysDates = (n = 7, baseDateStr = null) => {
  const today = baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)
    ? (() => {
        const [y, m, d] = baseDateStr.split("-").map(Number);
        return new Date(y, m - 1, d, 12, 0, 0);
      })()
    : new Date();

  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDateToString(d));
  }
  return dates;
};

/**
 * Gets the current week identifier, e.g. "2026-W41"
 */
export const getWeekIdentifier = (baseDateStr = null) => {
  const d = baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)
    ? (() => {
        const [y, m, day] = baseDateStr.split("-").map(Number);
        return new Date(y, m - 1, day, 12, 0, 0);
      })()
    : new Date();

  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
};

/**
 * Determines whether the user's current streak is still active or expired.
 * Streak is active if:
 * 1. User already practiced today (lastActiveStr === todayStr)
 * 2. User practiced yesterday, so today's practice is pending before midnight (lastActiveStr === yesterdayStr)
 * 3. User missed yesterday, but has an active Streak Freeze equipped (diffDays === 2)
 * Otherwise, streak is broken and returns 0.
 */
export const getActiveStreak = (
  lastActiveDate,
  currentStreak = 0,
  clientDate = null,
  streakFreeze = null
) => {
  if (!lastActiveDate || currentStreak <= 0) return 0;
  const todayStr = getTodayDateString(clientDate);
  const yesterdayStr = getYesterdayDateString(todayStr);
  const lastActiveStr = formatDateToString(new Date(lastActiveDate));

  if (lastActiveStr === todayStr || lastActiveStr === yesterdayStr) {
    return currentStreak;
  }

  // Check if Streak Freeze protects the gap
  const todayDate = new Date(todayStr + "T00:00:00Z");
  const lastDate = new Date(lastActiveStr + "T00:00:00Z");
  const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 2 && streakFreeze && streakFreeze.equipped > 0) {
    return currentStreak;
  }

  return 0;
};

/**
 * Calculates new streak status based on user's lastActiveDate and optional Streak Freeze
 */
export const calculateNewStreak = (
  lastActiveDate,
  currentStreak = 0,
  currentLongestStreak = 0,
  clientDate = null,
  streakFreeze = null
) => {
  const todayStr = getTodayDateString(clientDate);
  const yesterdayStr = getYesterdayDateString(todayStr);

  if (!lastActiveDate) {
    return {
      newStreak: 1,
      newLongestStreak: Math.max(1, currentLongestStreak),
      isStreakIncremented: true,
      alreadyActiveToday: false,
      freezeUsed: false,
      remainingFreeze: streakFreeze?.equipped || 0,
    };
  }

  const lastActiveStr = formatDateToString(new Date(lastActiveDate));

  if (lastActiveStr === todayStr) {
    // Already practiced/checked in today, keep current streak
    return {
      newStreak: currentStreak > 0 ? currentStreak : 1,
      newLongestStreak: Math.max(currentStreak, currentLongestStreak),
      isStreakIncremented: false,
      alreadyActiveToday: true,
      freezeUsed: false,
      remainingFreeze: streakFreeze?.equipped || 0,
    };
  } else if (lastActiveStr === yesterdayStr) {
    // Practiced yesterday, consecutive streak!
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newLongestStreak: Math.max(newStreak, currentLongestStreak),
      isStreakIncremented: true,
      alreadyActiveToday: false,
      freezeUsed: false,
      remainingFreeze: streakFreeze?.equipped || 0,
    };
  } else {
    // Check if Streak Freeze can save the streak (missed exactly 1 day)
    const todayDate = new Date(todayStr + "T00:00:00Z");
    const lastDate = new Date(lastActiveStr + "T00:00:00Z");
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 2 && streakFreeze && streakFreeze.equipped > 0 && currentStreak > 0) {
      // Streak Freeze automatically deployed!
      const newStreak = currentStreak + 1;
      return {
        newStreak,
        newLongestStreak: Math.max(newStreak, currentLongestStreak),
        isStreakIncremented: true,
        alreadyActiveToday: false,
        freezeUsed: true,
        remainingFreeze: Math.max(0, streakFreeze.equipped - 1),
      };
    }

    // Streak broken, reset to 1
    return {
      newStreak: 1,
      newLongestStreak: Math.max(1, currentLongestStreak),
      isStreakIncremented: true,
      alreadyActiveToday: false,
      freezeUsed: false,
      remainingFreeze: streakFreeze?.equipped || 0,
    };
  }
};
