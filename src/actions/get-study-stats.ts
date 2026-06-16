import { db } from "@/lib/db";
import { getUtcDay } from "@/lib/study-activity";

export type StudyStats = {
  currentStreak: number;
  maxStreak: number;
  daysLoggedIn: number;
  totalStudySeconds: number;
  todayStudySeconds: number;
  chaptersDone: number;
  activityDays: {
    date: string;
    secondsStudied: number;
  }[];
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const getCurrentStreak = (dates: Date[]) => {
  const activityDays = new Set(dates.map(toDateKey));
  let cursor = getUtcDay();
  let streak = 0;

  while (activityDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

const getMaxStreak = (dates: Date[]) => {
  const sortedDays = Array.from(new Set(dates.map(toDateKey))).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let previousDate: Date | null = null;

  for (const day of sortedDays) {
    const currentDate = new Date(`${day}T00:00:00.000Z`);
    const isConsecutive =
      previousDate && toDateKey(addDays(previousDate, 1)) === toDateKey(currentDate);

    currentStreak = isConsecutive ? currentStreak + 1 : 1;
    maxStreak = Math.max(maxStreak, currentStreak);
    previousDate = currentDate;
  }

  return maxStreak;
};

export const getStudyStats = async (userId: string): Promise<StudyStats> => {
  try {
    const [activities, chaptersDone] = await Promise.all([
      db.studyActivity.findMany({
        where: {
          userId,
        },
        orderBy: {
          date: "desc",
        },
      }),
      db.userProgress.count({
        where: {
          userId,
          isCompleted: true,
        },
      }),
    ]);

    const todayKey = toDateKey(getUtcDay());
    const todayActivity = activities.find((activity) => toDateKey(activity.date) === todayKey);
    const totalStudySeconds = activities.reduce(
      (total, activity) => total + activity.secondsStudied,
      0
    );

    const activityDates = activities.map((activity) => activity.date);

    return {
      currentStreak: getCurrentStreak(activityDates),
      maxStreak: getMaxStreak(activityDates),
      daysLoggedIn: activities.length,
      totalStudySeconds,
      todayStudySeconds: todayActivity?.secondsStudied ?? 0,
      chaptersDone,
      activityDays: activities.map((activity) => ({
        date: toDateKey(activity.date),
        secondsStudied: activity.secondsStudied,
      })),
    };
  } catch (error) {
    console.log("[GET_STUDY_STATS]", error);
    return {
      currentStreak: 0,
      maxStreak: 0,
      daysLoggedIn: 0,
      totalStudySeconds: 0,
      todayStudySeconds: 0,
      chaptersDone: 0,
      activityDays: [],
    };
  }
};
