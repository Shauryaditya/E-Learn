import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { loadTeacherDashboard } from "@/lib/teacher-dashboard";
import { TeacherDashboardView } from "./_components/teacher-dashboard-view";

export default async function TeacherDashboardPage() {
  const { userId } = auth();
  if (!userId) redirect("/");
  if (!isTeacher(userId)) redirect("/dashboard");
  const now = new Date();
  const data = await loadTeacherDashboard(db, userId, now);
  return <TeacherDashboardView data={data} now={now} />;
}
