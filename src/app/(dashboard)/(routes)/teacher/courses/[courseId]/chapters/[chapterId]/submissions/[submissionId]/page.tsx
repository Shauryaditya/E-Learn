import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImageGradingInterface } from "../_components/image-grading-interface";

export default async function SubmissionViewPage({
  params
}: {
  params: { courseId: string; chapterId: string; submissionId: string }
}) {
  const { userId } = auth();
  if (!userId) return redirect("/");

  // Check if teacher owns course
  const course = await db.course.findUnique({
    where: { id: params.courseId, userId }
  });
  if (!course) return redirect("/");

  const submission = await db.chapterSubmission.findUnique({
    where: { id: params.submissionId, chapterId: params.chapterId }
  });

  if (!submission) return redirect(`/teacher/courses/${params.courseId}/chapters/${params.chapterId}/submissions`);

  return (
    <div className="p-0 m-0 w-full h-full bg-slate-50 relative">
      <div className="absolute top-4 left-4 z-50">
        <Link 
            href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}/submissions`} 
            className="flex items-center text-sm font-medium bg-white px-3 py-2 rounded-md shadow-sm border hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions List
        </Link>
      </div>
      <div className="pt-16">
          <ImageGradingInterface submission={submission} courseId={params.courseId} chapterId={params.chapterId} />
      </div>
    </div>
  );
}
