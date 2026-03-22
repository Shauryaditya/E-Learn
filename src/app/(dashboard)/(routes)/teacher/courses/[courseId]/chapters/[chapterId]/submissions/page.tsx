import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SubmissionsPage({
  params
}: {
  params: { courseId: string; chapterId: string }
}) {
  const { userId } = auth();
  if (!userId) return redirect("/");

  // Check if teacher owns course
  const course = await db.course.findUnique({
    where: { id: params.courseId, userId }
  });
  if (!course) return redirect("/");

  const submissions = await db.chapterSubmission.findMany({
    where: { chapterId: params.chapterId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-6">
      <Link href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}`} className="flex items-center text-sm hover:opacity-75 transition mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to chapter setup
      </Link>
      <h1 className="text-2xl font-bold mb-6">Student Submissions</h1>
      
      <div className="grid gap-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="border p-4 rounded-md flex items-center justify-between bg-white shadow-sm">
            <div>
              <p className="font-medium text-slate-800">Student ID: {sub.userId}</p>
              <p className="text-sm text-slate-500">Submitted at: {sub.createdAt.toLocaleString()}</p>
              <p className="text-sm font-semibold text-sky-700 mt-1">Status: {sub.status}</p>
              <p className="text-sm text-slate-500 mt-1">{sub.images.length} Image(s)</p>
            </div>
            <Link href={`/teacher/courses/${params.courseId}/chapters/${params.chapterId}/submissions/${sub.id}`}>
              <Button variant="outline">View & Grade</Button>
            </Link>
          </div>
        ))}
        {submissions.length === 0 && (
          <p className="text-slate-500 italic">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}
