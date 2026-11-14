import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import type { PlannerRoadmap, PlannerSubject } from "@/lib/study-planner";
import { StudyPlanner } from "./_components/study-planner";

const PlannerPage = async () => {
  const { userId } = auth();
  if (!userId) redirect("/");

  const [plan, profile, academicChapters, courses, testSeries] = await Promise.all([
    db.studyPlan.findUnique({ where: { userId } }),
    db.studentProfile.findUnique({ where: { userId } }),
    db.academicChapter.findMany({
      select: { board: true, grade: true, subject: true, title: true },
      orderBy: [{ grade: "asc" }, { subject: "asc" }, { title: "asc" }],
    }),
    db.course.findMany({
      where: { isPublished: true },
      select: { title: true, category: { select: { name: true } }, chapters: { where: { isPublished: true }, select: { title: true } } },
    }),
    db.testSeries.findMany({
      where: { isPublished: true },
      select: { title: true, category: { select: { name: true } }, testChapters: { where: { isPublished: true }, select: { title: true } } },
    }),
  ]);

  const gradeFromTitle = (value: string) => {
    const numeric = value.match(/class\s*(8|9|10|11|12)\b/i)?.[1];
    if (numeric) return `Class ${numeric}`;
    const roman = value.match(/class\s*(VIII|IX|X|XI|XII)\b/i)?.[1]?.toUpperCase();
    const romanGrades: Record<string, string> = { VIII: "8", IX: "9", X: "10", XI: "11", XII: "12" };
    return roman ? `Class ${romanGrades[roman]}` : null;
  };
  const lmsChapters = [
    ...courses.flatMap((course) => {
      const grade = gradeFromTitle(course.title);
      return grade && course.category?.name ? course.chapters.map((chapter) => ({ board: "ALL", grade, subject: course.category!.name, title: chapter.title })) : [];
    }),
    ...testSeries.flatMap((series) => {
      const grade = gradeFromTitle(series.title);
      return grade && series.category?.name ? series.testChapters.filter((chapter) => !/^untitled/i.test(chapter.title)).map((chapter) => ({ board: "ALL", grade, subject: series.category!.name, title: chapter.title })) : [];
    }),
  ];
  const chapterCatalog = Array.from(new Map([...academicChapters, ...lmsChapters].map((item) => [`${item.board}|${item.grade}|${item.subject}|${item.title}`.toLowerCase(), item])).values());

  return (
    <StudyPlanner
      profile={profile ? { grade: profile.grade, board: profile.board, subjects: profile.subjects, targetExam: profile.targetExam } : null}
      chapterCatalog={chapterCatalog}
      initialPlan={plan ? {
        id: plan.id,
        grade: plan.grade,
        board: plan.board,
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
