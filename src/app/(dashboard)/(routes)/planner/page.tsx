import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import type { PlannerRoadmap, PlannerSubject } from "@/lib/study-planner";
import { StudyPlanner } from "./_components/study-planner";

const PlannerPage = async () => {
  const { userId } = auth();
  if (!userId) redirect("/");

  const [plan, profile] = await Promise.all([
    db.studyPlan.findUnique({ where: { userId } }),
    db.studentProfile.findUnique({ where: { userId } }),
  ]);

  return (
    <StudyPlanner
      profile={profile ? { grade: profile.grade, subjects: profile.subjects, targetExam: profile.targetExam } : null}
      initialPlan={plan ? {
        id: plan.id,
        grade: plan.grade,
        examName: plan.examName,
        examDate: plan.examDate.toISOString(),
        weeklyMinutes: plan.weeklyMinutes,
        subjects: plan.subjects as unknown as PlannerSubject[],
        roadmap: plan.roadmap as unknown as PlannerRoadmap,
      } : null}
    />
  );
};

export default PlannerPage;
