import { db } from "@/lib/db";

const maxHeartbeatSeconds = 120;

export const getUtcDay = (date = new Date()) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const recordStudyActivity = async (userId: string, secondsStudied = 0) => {
  const safeSeconds = Number.isFinite(secondsStudied)
    ? Math.max(0, Math.min(Math.round(secondsStudied), maxHeartbeatSeconds))
    : 0;
  const date = getUtcDay();

  return db.studyActivity.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    create: {
      userId,
      date,
      secondsStudied: safeSeconds,
      heartbeatCount: 1,
    },
    update: {
      secondsStudied: {
        increment: safeSeconds,
      },
      heartbeatCount: {
        increment: 1,
      },
    },
  });
};
