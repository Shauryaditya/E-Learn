import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { Separator } from "@/components/ui/separator";
import { Preview } from "@/components/preview";
import DocumentPreview from "@/components/document-preview";
import { VideoPlayer } from "./_components/video-player";

type PageProps = {
  params: { courseId: string; chapterId: string };
};

export default async function CourseChapterPage({ params }: PageProps) {
  const { userId } = auth();
  if (!userId) redirect("/");

  // Load chapter + parent course + attachments
  const chapter = await db.chapter.findUnique({
    where: { id: params.chapterId },
    include: {
      course: {
        include: {
          purchases: { where: { userId } },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
      },
      muxData: true,
    },
  });

  console.log("Chapter data:", chapter);

  if (!chapter || chapter.course.id !== params.courseId) {
    redirect("/");
  }

  const purchased = !!chapter.course.purchases.length;
  const canView = chapter.isPublished && (chapter.isFree || purchased);

  if (!canView) {
    redirect(`/courses/${params.courseId}`);
  }

  // Lock content for non-buyers (unless chapter is free)
  const isLocked = !chapter.isFree && !purchased;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header / breadcrumbs */}
      <div className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link href={`/courses/${chapter.course.id}`} className="underline">
              {chapter.course.title}
            </Link>
          </p>
          <h1 className="text-2xl font-semibold">{chapter.title}</h1>
        </div>
      </div>

      {/* Informational banners */}
      {isLocked && (
        <Banner
          variant="warning"
          label="Purchase this course to unlock all content."
        />
      )}

      <Separator className="my-6" />

      {/* Video Player */}
      {chapter.videoUrl && (
        <div className="p-4">
          <VideoPlayer
            chapterId={chapter.id}
            title={chapter.title}
            courseId={params.courseId}
            videoUrl={chapter.videoUrl}
            isLocked={isLocked}
          />
        </div>
      )}

      {/* Chapter description */}
      {chapter.description && (
        <div className="p-4">
          <Preview value={chapter.description} />
        </div>
      )}

      {/* Attachments */}
      {chapter.attachments.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="p-4">
            <h2 className="text-sm font-semibold text-blue-800 mb-3">
              Course Materials
            </h2>

            {isLocked && (
              <p className="text-red-500 mb-3">
                Purchase the course to view and download materials.
              </p>
            )}

            <div className="grid gap-4">
              {chapter.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`bg-white w-full p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition ${isLocked ? "blur-sm select-none pointer-events-none" : ""
                    }`}
                >
                  {/* Optional name/label above the preview */}
                  {attachment.name && (
                    <div className="mb-2 text-sm font-medium text-gray-800">
                      {attachment.name}
                    </div>
                  )}

                  {/* Preview the document */}
                  <DocumentPreview fileUrl={attachment.url} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
