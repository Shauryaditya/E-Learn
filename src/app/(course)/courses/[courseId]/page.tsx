import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { Preview } from "@/components/preview";
import { CourseEnrollButton } from "./chapters/[chapterId]/_components/course-enroll-button";

const CourseIdPage = async ({
  params
}: {
  params: { courseId: string; }
}) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
  });

  if (!course) {
    return redirect("/");
  }

  const purchase = await db.purchase.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      }
    }
  });

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
                  ₹{course.price.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time payment • Lifetime access
                </p>
              </div>
              <CourseEnrollButton courseId={course.id} price={course.price} />
            </div>
          </div>
        )}

        {purchase && (
          <div className="border-2 border-emerald-500 rounded-lg p-6 bg-emerald-50 dark:bg-emerald-950">
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
              ✓ You are enrolled in this course
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              Select a chapter from the sidebar to continue learning
            </p>
          </div>
        )}

        {/* Additional Info */}
        {!purchase && (
          <div className="text-sm text-muted-foreground">
            <p>💡 Some chapters may be available as free previews. Check the sidebar to see what's unlocked.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseIdPage;