
import { db } from "@/lib/db";

export const getStudentPerformance = async (userId: string) => {
  try {
    const attempts = await db.testAttempt.findMany({
        where: { userId },
        include: { test: true },
        orderBy: { createdAt: "desc" },
        take: 10, // Recent 10 attempts
    });

    return attempts.map(attempt => ({
        name: attempt.test.title,
        score: attempt.percentage || 0,
    }));
  } catch (error) {
    console.log("[GET_STUDENT_PERFORMANCE]", error);
    return [];
  }
};
