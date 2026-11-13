import { auth } from "@clerk/nextjs";
import { Database, GraduationCap, School } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPracticeCollections } from "@/actions/get-practice-collections";
import { db } from "@/lib/db";
import { PracticeDirectory } from "./_components/practice-directory";

export default async function PracticePage() {
  const { userId } = auth();
  if (!userId) redirect("/");
  const [practiceCollections, studentProfile, studyPlan] = await Promise.all([
    getPracticeCollections(userId),
    db.studentProfile.findUnique({ where: { userId }, select: { board: true, grade: true, subjects: true, targetExam: true } }),
    db.studyPlan.findUnique({ where: { userId }, select: { examName: true } }),
  ]);
  const profile = studentProfile ? { ...studentProfile, targetExam: studyPlan?.examName || studentProfile.targetExam } : null;
  const totals = practiceCollections.reduce((sum, item) => ({ papers: sum.papers + item.paperCount, questions: sum.questions + item.questionCount }), { papers: 0, questions: 0 });

  return <div className="min-h-full bg-background">
    <header className="border-b bg-card"><div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:py-6 lg:px-8">
      <div className="md:hidden"><h1 className="text-xl font-bold tracking-tight">Practice</h1><p className="mt-0.5 text-xs text-muted-foreground">{totals.questions.toLocaleString("en-IN")} questions for school, boards and entrance exams</p></div>
      <div className="hidden flex-col justify-between gap-5 md:flex md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2"><Badge className="bg-blue-600 text-white hover:bg-blue-600">Question Library</Badge><span className="text-xs text-muted-foreground">School and entrance exams</span></div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Choose your goal. Practice chapter-wise.</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">School, board, JEE and NEET papers converted into questions you can browse and practise.</p></div>
        <div className="grid grid-cols-3 gap-5 text-right"><Stat value={practiceCollections.length} label="Collections" /><Stat value={totals.papers} label="Papers" /><Stat value={totals.questions.toLocaleString("en-IN")} label="Questions" /></div></div>
      <div className="mt-5 hidden flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground md:flex"><span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />4 boards</span><span className="flex items-center gap-1.5"><School className="h-3.5 w-3.5" />School-wise coverage</span><span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />Paper, question and chapter views</span></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-3 pb-24 sm:px-6 md:py-6 lg:px-8"><PracticeDirectory collections={practiceCollections} profile={profile} /></main>
  </div>;
}

const Stat = ({ value, label }: { value: string | number; label: string }) => <div><p className="text-lg font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
