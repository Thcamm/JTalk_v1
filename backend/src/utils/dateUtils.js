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

export const getTodayDateString = () => {
  return formatDateToString(new Date());
};

export const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToString(d);
};

export const getPastNDaysDates = (n = 7) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDateToString(d));
  }
  return dates;
};

/**
 * Determines whether the user's current streak is still active or expired.
 * Streak is active if:
 * 1. User already practiced today (lastActiveStr === todayStr)
 * 2. User practiced yesterday, so today's practice is pending before midnight (lastActiveStr === yesterdayStr)
 * Otherwise, streak is broken and returns 0.
 */
export const getActiveStreak = (lastActiveDate, currentStreak = 0) => {
  if (!lastActiveDate || currentStreak <= 0) return 0;
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const lastActiveStr = formatDateToString(new Date(lastActiveDate));

  if (lastActiveStr === todayStr || lastActiveStr === yesterdayStr) {
    return currentStreak;
  }
  return 0;
};

/**
 * Calculates new streak status based on user's lastActiveDate
 */
export const calculateNewStreak = (lastActiveDate, currentStreak = 0, currentLongestStreak = 0) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  if (!lastActiveDate) {
    return {
      newStreak: 1,
      newLongestStreak: Math.max(1, currentLongestStreak),
      isStreakIncremented: true,
    };
  }

  const lastActiveStr = formatDateToString(new Date(lastActiveDate));

  if (lastActiveStr === todayStr) {
    // Already practiced today, keep current streak
    return {
      newStreak: currentStreak > 0 ? currentStreak : 1,
      newLongestStreak: Math.max(currentStreak, currentLongestStreak),
      isStreakIncremented: false,
    };
  } else if (lastActiveStr === yesterdayStr) {
    // Practiced yesterday, consecutive streak!
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newLongestStreak: Math.max(newStreak, currentLongestStreak),
      isStreakIncremented: true,
    };
  } else {
    // Streak broken, reset to 1
    return {
      newStreak: 1,
      newLongestStreak: Math.max(1, currentLongestStreak),
      isStreakIncremented: true,
    };
  }
};
