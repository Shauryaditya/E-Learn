
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export const getStudentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  try {
    const profile = await db.studentProfile.findUnique({
      where: {
        userId,
      },
    });

    return profile;
  } catch (error) {
    console.log("[GET_STUDENT_PROFILE]", error);
    return null;
  }
};
