import { auth } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { loadContestSubmission, parseSubmissionParams, submissionsHref } from "@/lib/contest-submissions";
import { getContestStudents } from "@/lib/contest-students";
import { ContestAttemptReview } from "../../_components/contest-attempts-review";
import { ContestRefreshButton } from "../../_components/contest-refresh-button";

export default async function ContestSubmissionPage({ params, searchParams }: {
  params: { contestId: string; registrationId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const registration = await loadContestSubmission(db, userId, params.contestId, params.registrationId);
  if (!registration) notFound();
  const { students, unavailable } = await getContestStudents([registration.userId]);
  const student = students.get(registration.userId)!;
  return <div className="min-w-0 space-y-5 p-4 sm:p-6">
    <div className="flex items-center justify-between gap-3">
      <Link href={submissionsHref(params.contestId, parseSubmissionParams(searchParams))}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to submissions
      </Link>
      <ContestRefreshButton />
    </div>
    {unavailable && <p className="text-sm text-muted-foreground">Student details are temporarily unavailable. The student ID is shown below.</p>}
    <ContestAttemptReview registration={registration} questions={registration.contest.questions} student={student} now={new Date()} />
  </div>;
}
