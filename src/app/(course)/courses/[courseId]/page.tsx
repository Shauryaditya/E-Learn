import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { Preview } from "@/components/preview";
import { CourseEnrollButton } from "./chapters/[chapterId]/_components/course-enroll-button";
import { AuthPromptButton } from "@/components/auth-prompt-button";

const CourseIdPage = async ({
  params
}: {
  params: { courseId: string; }
}) => {
  const { userId } = auth();

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    return redirect("/");
  }

  const purchase = userId
    ? await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id,
        }
      }
    })
    : null;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Course Description */}
        {course.description && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">About this course</h2>
            <Preview value={course.description} />
          </div>
        )}

        {/* Enrollment Section */}
        {!purchase && course.price !== null && (
          <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Enroll in this course</h3>
                <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">
                  INR {course.price.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time payment. Lifetime access.
                </p>
              </div>
              <div className="flex flex-col gap-y-2 md:flex-row md:gap-x-2">
                 {course.chapters[0] && (
                    userId ? (
                      <a
                        href={`/courses/${course.id}/chapters/${course.chapters[0].id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 py-2 w-full md:w-auto"
                      >
                        Start Learning
                      </a>
                    ) : (
                      <AuthPromptButton
                        label="Start Learning"
                        redirectUrl={`/courses/${course.id}/chapters/${course.chapters[0].id}`}
                        variant="outline"
                        size="lg"
                        className="w-full md:w-auto"
                      />
                    )
                 )}
                <CourseEnrollButton courseId={course.id} price={course.price} />
              </div>
            </div>
          </div>
        )}

        {purchase && (
          <div className="border-2 border-emerald-500 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-950">
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
              You are enrolled in this course
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 mb-4">
              Select a chapter from the sidebar to continue learning
            </p>
            
             {course.chapters[0] && (
                <a 
                  href={`/courses/${course.id}/chapters/${course.chapters[0].id}`}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full md:w-auto"
                >
                  Start Learning
                </a>
             )}
          </div>
        )}

        {/* Additional Info */}
        {!purchase && (
          <div className="text-sm text-muted-foreground">
            <p>Tip: Some chapters may be available as free previews. Check the sidebar to see what&apos;s unlocked.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseIdPage;
