import { getChapter } from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { VideoPlayer } from "./_components/video-player";
import { CourseEnrollButton } from "./_components/course-enroll-button";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";
import { File } from "lucide-react";
import { CourseProgressButton } from "./_components/course-progress-button";

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
    purchase,
  } = await getChapter({
    userId,
    chapterId: params.chapterId,
    courseId: params.courseId,
  });

  if (!chapter || !course) {
    return redirect("/");
  }

  console.log("Chapter ID>>", chapter);

  const isLocked = !chapter.isFree && !purchase;
  const completeOnEnd = !!purchase && !userProgress?.isCompleted;

  return (
    <div className="">
      {userProgress?.isCompleted && (
        <Banner variant="success" label="You already completed this chapter" />
      )}
      {isLocked && (
        <Banner
          variant="warning"
          label="You need to purchase this course to watch this chapter"
        />
      )}
      <div className="flex flex-col max-w-4xl mx-auto pb-20">
        <div className="p-4">
          {chapter.videoUrl ? ( // Use videoUrl instead of playbackId
            <VideoPlayer
              videoUrl={chapter.videoUrl}
              chapterId={params.chapterId}
              title={chapter.title}
              courseId={params.courseId}
              nextChapterId={nextChapter?.id!}
              isLocked={isLocked}
              completeOnEnd={completeOnEnd}
            />
          ) : (
            <></>
          )}
        </div>
        <div className="">
          <div className="p-4 flex flex-col md:flex-row items-center justify-between">
            <h2 className="text-2xl font-semibold mb-2">{chapter.title}</h2>
            {purchase ? (
              <CourseProgressButton
                chapterId={params.chapterId}
                courseId={params.courseId}
                nextChapterId={nextChapter?.id}
                isCompleted={!!userProgress?.isCompleted}
              />
            ) : (
              <CourseEnrollButton
                courseId={params.courseId}
                price={course.price!}
              />
            )}
          </div>
          <Separator />
          <div className="">
            <Preview value={chapter.description!} />
          </div>
          {!!attachments.length &&
            !isLocked && ( // Check if not locked before showing attachments
              <>
                <Separator />
                <div className="p-4">
                  <h1 className="text-sm font-semibold text-blue-800">
                    Notes and Assessments
                  </h1>
                  <div className="flex flex-wrap gap-4">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="bg-white w-48 p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300"
                      >
                        <p className="text-lg font-semibold text-gray-800 mb-2">
                          {chapter.title}
                        </p>
                        <a
                          href={attachment.url}
                          target="_blank"
                          className="flex items-center gap-2 p-2 w-full bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors duration-300"
                        >
                          <File className="w-5 h-5 text-blue-600" />
                          <p className="line-clamp-1 font-medium">
                            {attachment.name}
                          </p>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChapterIdPage;
