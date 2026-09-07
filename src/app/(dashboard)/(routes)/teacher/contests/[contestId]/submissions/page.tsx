import { auth, clerkClient } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { loadContestSubmissions } from "@/lib/contest-submissions";
import { getContestStudents } from "@/lib/contest-students";
import { ContestSubmissionsList } from "../_components/contest-submissions-list";

export default async function ContestSubmissionsPage({ params, searchParams }: {
  params: { contestId: string }; searchParams: Record<string, string | string[] | undefined>;
}) {
  const { userId } = auth();
  if (!userId) redirect("/");
  const now = new Date();
  const data = await loadContestSubmissions(db, userId, params.contestId, searchParams, async email => {
    const users = await clerkClient.users.getUserList({ emailAddress: [email], limit: 10 });
    return users.map(user => user.id);
  }, now);
  if (!data) notFound();
  const { students, unavailable } = await getContestStudents(data.registrations.map(registration => registration.userId));
  return <ContestSubmissionsList contestId={params.contestId} data={data} students={Object.fromEntries(students)} now={now} identityUnavailable={unavailable} />;
}
