
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

export const getStudentProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const profile = await db.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  return profile;
};
