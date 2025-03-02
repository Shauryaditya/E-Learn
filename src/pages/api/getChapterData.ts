import { NextApiRequest, NextApiResponse } from 'next';
import { getChapter } from "@/actions/get-chapter";
import { auth } from "@clerk/nextjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { courseId, chapterId } = req.query;

  const { userId } = auth();
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const data = await getChapter({
    userId,
    chapterId: chapterId as string,
    courseId: courseId as string,
  });

  if (!data.chapter || !data.course) {
    return res.status(404).json({ error: "Not Found" });
  }

  res.status(200).json(data);
}
