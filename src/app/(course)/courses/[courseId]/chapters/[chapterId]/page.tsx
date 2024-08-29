import { getChapter } from "@/actions/get-chapter";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const ChapterIdPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const { userId } = auth();
  if (!userId) {
    return redirect("/");
  }

  const {
    chapter,
    course,
    muxData,
    attachments,
    nextChapter,
    userProgress,
    purchase
  } 
  = await getChapter({
    userId,
    chapterId: params.chapterId,
    courseId: params.courseId
  })
  return (
  <div className="">
    Chapter iD
</div>);
};

export default ChapterIdPage;
