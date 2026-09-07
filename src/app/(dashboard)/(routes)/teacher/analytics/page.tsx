import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  loadContestAnalytics,
  loadCourseAnalytics,
  loadTestSeriesAnalytics,
  parseAnalyticsView,
} from "@/lib/teacher-analytics";
import { isTeacher } from "@/lib/teacher";
import { TeacherAnalyticsView } from "./_components/teacher-analytics-view";

type AnalyticsPageProps = {
  searchParams: { view?: string | string[] };
};

const AnalyticsPage = async ({ searchParams }: AnalyticsPageProps) => {
  const { userId } = auth();

  if (!userId) return redirect("/");
  if (!isTeacher(userId)) return redirect("/dashboard");

  const view = parseAnalyticsView(searchParams.view);
  const data = view === "contests"
    ? await loadContestAnalytics(db, userId)
    : view === "test-series"
      ? await loadTestSeriesAnalytics(db, userId)
      : await loadCourseAnalytics(db, userId);

  return <TeacherAnalyticsView data={data} />;
};

export default AnalyticsPage;
