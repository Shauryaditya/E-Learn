import { auth } from "@clerk/nextjs";
import { Database, GraduationCap, School } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPracticeCollections } from "@/actions/get-practice-collections";
import { PracticeDirectory } from "./_components/practice-directory";

export default async function PracticePage() {
  const { userId } = auth();
  if (!userId) redirect("/");
  const practiceCollections = await getPracticeCollections();
  const totals = practiceCollections.reduce((sum, item) => ({ papers: sum.papers + item.paperCount, questions: sum.questions + item.questionCount }), { papers: 0, questions: 0 });

  return <div className="min-h-full bg-background">
    <header className="border-b bg-card"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2"><Badge className="bg-blue-600 text-white hover:bg-blue-600">Question Library</Badge><span className="text-xs text-muted-foreground">Classes 8–12</span></div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Find papers. Practice chapter-wise.</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">School and board papers for ISC, ICSE, CBSE and Madhyamik—converted into questions you can browse and practise.</p></div>
        <div className="grid grid-cols-3 gap-5 text-right"><Stat value={practiceCollections.length} label="Collections" /><Stat value={totals.papers} label="Papers" /><Stat value={totals.questions.toLocaleString("en-IN")} label="Questions" /></div></div>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />4 boards</span><span className="flex items-center gap-1.5"><School className="h-3.5 w-3.5" />School-wise coverage</span><span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5" />Paper, question and chapter views</span></div>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8"><PracticeDirectory collections={practiceCollections} /></main>
  </div>;
}

const Stat = ({ value, label }: { value: string | number; label: string }) => <div><p className="text-lg font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
