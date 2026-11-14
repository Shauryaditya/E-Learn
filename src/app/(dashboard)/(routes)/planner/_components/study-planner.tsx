"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Clock3,
  Edit3,
  ExternalLink,
  FileQuestion,
  FileText,
  ListChecks,
  LockKeyhole,
  Loader2,
  MessageSquarePlus,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getRoadmapProgress, type PlannerResource, type PlannerRoadmap, type PlannerSubject, type PlannerTask } from "@/lib/study-planner";

const GRADES = ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const BOARDS = ["CBSE", "ICSE", "ISC", "Madhyamik"];
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Computer Science", "History", "Geography", "Accountancy", "Economics", "Business Studies"];
const STEP_LABELS = ["Goal", "Subjects", "Chapters", "Weekly time", "Review"];

type InitialPlan = {
  id: string;
  grade: string;
  board: string | null;
  examName: string;
  examDate: string;
  weeklyMinutes: number;
  subjects: PlannerSubject[];
  roadmap: PlannerRoadmap;
};

type StudyPlannerProps = {
  profile: { grade: string | null; board: string | null; subjects: string[]; targetExam: string | null } | null;
  initialPlan: InitialPlan | null;
  chapterCatalog: { board: string; grade: string; subject: string; title: string }[];
};

const inputClass = "h-11 rounded-xl border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-slate-950";
const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60 ? `${minutes % 60}m` : ""}`.trim();

export const StudyPlanner = ({ profile, initialPlan, chapterCatalog }: StudyPlannerProps) => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [plan, setPlan] = useState(initialPlan);
  const [editing, setEditing] = useState(!initialPlan);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [grade, setGrade] = useState(initialPlan?.grade || profile?.grade || "");
  const [board, setBoard] = useState(initialPlan?.board || profile?.board || "");
  const [examName, setExamName] = useState(initialPlan?.examName || profile?.targetExam || "");
  const [examDate, setExamDate] = useState(initialPlan?.examDate.slice(0, 10) || "");
  const [subjects, setSubjects] = useState<PlannerSubject[]>(
    initialPlan?.subjects || (profile?.subjects || []).map((name) => ({ name, weeklyMinutes: 120, chapters: [] }))
  );

  const totalMinutes = subjects.reduce((total, subject) => total + subject.weeklyMinutes, 0);
  const subjectOptions = useMemo(() => {
    const exact = chapterCatalog.filter((item) => item.grade === grade && (item.board === board || item.board === "ALL"));
    const sameClass = chapterCatalog.filter((item) => item.grade === grade);
    const available = (exact.length ? exact : sameClass).map((item) => item.subject);
    return Array.from(new Set([...available, ...subjects.map((subject) => subject.name)])).sort((a, b) => a.localeCompare(b));
  }, [board, chapterCatalog, grade, subjects]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(grade && board && examName.trim() && examDate && examDate >= tomorrow);
    if (step === 1) return subjects.length > 0;
    if (step === 2) return subjects.every((subject) => subject.chapters.length > 0);
    return true;
  }, [step, grade, board, examName, examDate, subjects, tomorrow]);

  const toggleSubject = (name: string) => {
    setSubjects((current) => current.some((subject) => subject.name === name)
      ? current.filter((subject) => subject.name !== name)
      : [...current, { name, weeklyMinutes: 120, chapters: [] }]);
  };

  const updateSubject = (name: string, update: Partial<PlannerSubject>) => {
    setSubjects((current) => current.map((subject) => subject.name === name ? { ...subject, ...update } : subject));
  };

  const changeSyllabus = (kind: "grade" | "board", value: string) => {
    if (kind === "grade") setGrade(value); else setBoard(value);
    setSubjects([]);
  };

  const moveStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const createPlan = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, board, examName, examDate, subjects }),
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      setPlan({ ...result, examDate: result.examDate, subjects: result.subjects, roadmap: result.roadmap });
      setEditing(false);
      setStep(0);
      toast.success("Your roadmap is ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your roadmap");
    } finally {
      setSaving(false);
    }
  };

  if (plan && !editing) {
    return <RoadmapView plan={plan} onPlanChange={setPlan} onEdit={() => setEditing(true)} />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-24 pt-3 sm:px-6 sm:py-6 lg:py-8">
      <header className="mb-4 sm:mb-7">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 sm:mb-3 sm:px-3 sm:text-xs">
          <Sparkles className="h-3.5 w-3.5" /> Personal study planner
        </div>
        <h1 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Build a plan around your exam</h1>
        <p className="mt-1.5 hidden max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:block">Tell us where you need help and how much time you have. We will turn it into a practical weekly roadmap that you can adjust anytime.</p>
      </header>

      <div className="mb-4 sm:mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{STEP_LABELS[step]}</span><span>{step + 1} of {STEP_LABELS.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div className="h-full rounded-full bg-blue-600" animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      </div>

      <div className="overflow-hidden bg-transparent px-0 py-1 sm:min-h-[430px] sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-white sm:p-8 sm:shadow-sm sm:dark:border-white/10 sm:dark:bg-slate-950">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -18 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {step === 0 && <GoalStep grade={grade} setGrade={(value: string) => changeSyllabus("grade", value)} board={board} setBoard={(value: string) => changeSyllabus("board", value)} examName={examName} setExamName={setExamName} examDate={examDate} setExamDate={setExamDate} minDate={tomorrow} />}
            {step === 1 && <SubjectsStep subjects={subjects} toggleSubject={toggleSubject} options={subjectOptions.length ? subjectOptions : SUBJECTS} />}
            {step === 2 && <ChaptersStep subjects={subjects} updateSubject={updateSubject} grade={grade} board={board} catalog={chapterCatalog} />}
            {step === 3 && <TimeStep subjects={subjects} updateSubject={updateSubject} totalMinutes={totalMinutes} />}
            {step === 4 && <ReviewStep grade={grade} board={board} examName={examName} examDate={examDate} subjects={subjects} totalMinutes={totalMinutes} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(8rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between border-t bg-background/95 px-4 py-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:sticky md:bottom-0 md:z-20 md:mx-0 md:mt-5 md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none">
        <Button variant="ghost" disabled={step === 0 || saving} onClick={() => moveStep(step - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        {step < STEP_LABELS.length - 1 ? (
          <Button disabled={!canContinue} onClick={() => moveStep(step + 1)} className="bg-blue-600 text-white hover:bg-blue-700">Continue<ArrowRight className="ml-2 h-4 w-4" /></Button>
        ) : (
          <Button disabled={saving} onClick={createPlan} className="bg-blue-600 text-white hover:bg-blue-700">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate my roadmap</Button>
        )}
      </div>
    </div>
  );
};

const StepHeading = ({ icon: Icon, title, description }: { icon: typeof Target; title: string; description: string }) => (
  <div className="mb-4 flex gap-2.5 sm:mb-7 sm:gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 sm:h-10 sm:w-10 sm:rounded-xl"><Icon className="h-4 w-4 sm:h-5 sm:w-5" /></div><div className="min-w-0"><h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-slate-500 sm:mt-1 sm:text-sm sm:leading-5">{description}</p></div></div>
);

const GoalStep = ({ grade, setGrade, board, setBoard, examName, setExamName, examDate, setExamDate, minDate }: any) => (
  <div><StepHeading icon={Target} title="What are you preparing for?" description="Your class and board help us show the correct syllabus." /><div className="grid grid-cols-2 gap-3 sm:gap-5"><div className="space-y-1.5 text-xs font-medium sm:space-y-2 sm:text-sm"><span>Your class</span><Select value={grade} onValueChange={setGrade}><SelectTrigger className={inputClass}><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{GRADES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5 text-xs font-medium sm:space-y-2 sm:text-sm"><span>Your board</span><Select value={board} onValueChange={setBoard}><SelectTrigger className={inputClass}><SelectValue placeholder="Select board" /></SelectTrigger><SelectContent>{BOARDS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><label className="col-span-2 space-y-1.5 text-xs font-medium sm:col-span-1 sm:space-y-2 sm:text-sm">Exam or goal<Input value={examName} onChange={(event) => setExamName(event.target.value)} placeholder="e.g. Class 10 boards" className={inputClass} /></label><div className="col-span-2 space-y-1.5 text-xs font-medium sm:col-span-1 sm:space-y-2 sm:text-sm"><span>Examination date</span><DatePicker value={examDate} onChange={setExamDate} minDate={new Date(`${minDate}T00:00:00`)} placeholder="Select examination date" className="h-11 w-full rounded-xl" /></div></div></div>
);

const SubjectsStep = ({ subjects, toggleSubject, options }: { subjects: PlannerSubject[]; toggleSubject: (name: string) => void; options: string[] }) => (
  <div><StepHeading icon={BookOpenCheck} title="Where would you like guidance?" description="Choose from the subjects available for your selected class and board." /><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">{options.map((name) => { const selected = subjects.some((subject) => subject.name === name); return <button type="button" key={name} onClick={() => toggleSubject(name)} className={cn("flex min-h-14 items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition hover:-translate-y-0.5 sm:min-h-16 sm:px-4 sm:py-3 sm:text-sm", selected ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm dark:bg-blue-950/40 dark:text-blue-200" : "border-slate-200 hover:border-blue-300 dark:border-white/10")}><span>{name}</span>{selected && <Check className="h-4 w-4 shrink-0" />}</button>; })}</div></div>
);

const ChaptersStep = ({ subjects, updateSubject, grade, board, catalog }: { subjects: PlannerSubject[]; updateSubject: (name: string, update: Partial<PlannerSubject>) => void; grade: string; board: string; catalog: { board: string; grade: string; subject: string; title: string }[] }) => {
  const optionsFor = (subjectName: string) => {
    const exact = catalog.filter((item) => item.grade === grade && (item.board === board || item.board === "ALL") && item.subject.toLowerCase() === subjectName.toLowerCase());
    const sameClass = catalog.filter((item) => item.grade === grade && item.subject.toLowerCase() === subjectName.toLowerCase());
    const titles = Array.from(new Set((exact.length ? exact : sameClass).map((item) => item.title))).sort((a, b) => a.localeCompare(b));
    return titles.length ? titles : [`Complete ${subjectName} syllabus`];
  };
  return (
    <div>
      <StepHeading icon={BookOpenCheck} title="Which chapters need attention?" description={`Choose one or more chapters from the ${board} ${grade} material available on Aaccent.`} />
      <div className="space-y-3">
        {subjects.map((subject) => <ChapterMultiSelect key={subject.name} subject={subject} options={optionsFor(subject.name)} onChange={(chapters) => updateSubject(subject.name, { chapters })} />)}
      </div>
    </div>
  );
};

const ChapterMultiSelect = ({ subject, options, onChange }: { subject: PlannerSubject; options: string[]; onChange: (chapters: string[]) => void }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const toggle = (chapter: string) => onChange(subject.chapters.includes(chapter) ? subject.chapters.filter((item) => item !== chapter) : [...subject.chapters, chapter]);
  const availableOptions = Array.from(new Set([...subject.chapters, ...options]));
  const filtered = availableOptions.filter((chapter) => chapter.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10 sm:p-4"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-semibold">{subject.name}</span><span className="text-[11px] text-slate-500">{subject.chapters.length} selected</span></div><Button type="button" variant="outline" aria-expanded={open} onClick={() => { setOpen((value) => !value); if (open) setQuery(""); }} className="h-11 w-full justify-between rounded-xl px-3 font-normal"><span className="truncate text-sm">{subject.chapters.length ? `${subject.chapters.length} chapter${subject.chapters.length === 1 ? "" : "s"} selected` : "Select chapters"}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>{open && <div className="mt-2 overflow-hidden rounded-xl border bg-background shadow-sm"><div className="border-b p-2"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${subject.name} chapters`} className="h-9" /></div><div className="max-h-64 overflow-y-auto p-1">{filtered.length ? filtered.map((chapter) => { const selected = subject.chapters.includes(chapter); return <label key={chapter} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm transition hover:bg-accent"><input type="checkbox" checked={selected} onChange={() => toggle(chapter)} className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600" /><span>{chapter}</span></label>; }) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No chapter found.</p>}</div></div>}{subject.chapters.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{subject.chapters.map((chapter) => <button type="button" key={chapter} onClick={() => toggle(chapter)} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">{chapter}<span className="ml-1.5" aria-hidden>×</span></button>)}</div>}</div>;
};

const TimeStep = ({ subjects, updateSubject, totalMinutes }: { subjects: PlannerSubject[]; updateSubject: (name: string, update: Partial<PlannerSubject>) => void; totalMinutes: number }) => (
  <div><StepHeading icon={Clock3} title="How much time can you commit?" description="Choose a realistic weekly target for each subject." /><div className="space-y-5">{subjects.map((subject) => <div key={subject.name} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">{subject.name}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{formatMinutes(subject.weeklyMinutes)} / week</span></div><input type="range" min="30" max="600" step="30" value={subject.weeklyMinutes} onChange={(event) => updateSubject(subject.name, { weeklyMinutes: Number(event.target.value) })} className="w-full accent-blue-600" /></div>)}<div className="text-right text-sm text-slate-500">Total commitment: <strong className="text-slate-900 dark:text-white">{formatMinutes(totalMinutes)} per week</strong></div></div></div>
);

const ReviewStep = ({ grade, board, examName, examDate, subjects, totalMinutes }: { grade: string; board: string; examName: string; examDate: string; subjects: PlannerSubject[]; totalMinutes: number }) => (
  <div><StepHeading icon={Sparkles} title="Ready to build your roadmap" description="We will rotate learning, practice, testing and revision across the time available." /><div className="grid gap-3 sm:grid-cols-3 sm:gap-4"><SummaryCard icon={Target} label="Goal" value={`${examName} · ${board} ${grade}`} /><SummaryCard icon={CalendarDays} label="Exam date" value={new Date(`${examDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} /><SummaryCard icon={Clock3} label="Weekly time" value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} /></div><div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-white/[0.03] sm:mt-5 sm:p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Subjects and chapters</p>{subjects.map((subject) => <div key={subject.name} className="border-b border-slate-200 py-3 last:border-0 dark:border-white/10"><p className="text-sm font-semibold">{subject.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{subject.chapters.join(" · ")}</p></div>)}</div></div>
);

const SummaryCard = ({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) => <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><Icon className="mb-3 h-5 w-5 text-blue-600" /><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;

const TaskResources = ({ resources }: { resources?: PlannerResource[] }) => {
  if (!resources?.length) return null;

  return (
    <div className="-mr-3 mt-2.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pr-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mr-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pr-0">
      {resources.map((resource) => {
        const Icon = resource.kind === "LEARNING_MATERIAL" ? FileText : resource.kind === "PAPER_PRACTICE" ? FileQuestion : ListChecks;
        const color = resource.kind === "LEARNING_MATERIAL" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : resource.kind === "PAPER_PRACTICE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300";
        return (
          <Link
            key={`${resource.kind}-${resource.id}`}
            href={resource.href}
            className="group/resource flex min-w-[82%] snap-start items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-800 dark:hover:bg-blue-950/20 sm:min-w-0 sm:gap-3 sm:p-3"
          >
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9", color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{resource.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{resource.context}</p>
              <span className="mt-1 inline-flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {!resource.hasAccess && <LockKeyhole className="mr-1 h-3 w-3" />}
                {resource.hasAccess ? (resource.kind === "LEARNING_MATERIAL" ? "Open material" : resource.kind === "PAPER_PRACTICE" ? "Practise paper questions" : "Start test") : "View recommendation"}
              </span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover/resource:text-blue-600" />
          </Link>
        );
      })}
    </div>
  );
};

const TaskNote = ({ task, onSave }: { task: PlannerTask; onSave: (note: string) => void }) => {
  const [editing, setEditing] = useState(Boolean(task.note));
  const [note, setNote] = useState(task.note);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="mt-3 inline-flex items-center text-xs font-medium text-slate-500 transition hover:text-blue-600">
        <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />Add a note
      </button>
    );
  }

  return (
    <div className="mt-2.5 flex flex-col gap-2 rounded-lg bg-slate-50 p-2 dark:bg-white/[0.03] min-[400px]:flex-row min-[400px]:items-end">
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} autoFocus placeholder="Your reminder or personal note" className="min-h-14 flex-1 resize-none border-0 bg-transparent p-1 text-xs outline-none" />
      <div className="flex justify-end gap-1">
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Cancel note" onClick={() => { setNote(task.note); setEditing(Boolean(task.note)); }}><span aria-hidden>×</span></Button>
        <Button type="button" size="icon" className="h-8 w-8" aria-label="Save note" onClick={() => { onSave(note.trim()); if (!note.trim()) setEditing(false); }}><Save className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
};

const RoadmapView = ({ plan, onPlanChange, onEdit }: { plan: InitialPlan; onPlanChange: (plan: InitialPlan) => void; onEdit: () => void }) => {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [newTask, setNewTask] = useState("");
  const progress = getRoadmapProgress(plan.roadmap);
  const week = plan.roadmap.weeks[selectedWeek] || plan.roadmap.weeks[0];

  const saveRoadmap = async (roadmap: PlannerRoadmap, message?: string) => {
    onPlanChange({ ...plan, roadmap });
    try {
      setSaving(true);
      const response = await fetch("/api/planner", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roadmap }) });
      if (!response.ok) throw new Error();
      if (message) toast.success(message);
    } catch { toast.error("Your change could not be saved"); }
    finally { setSaving(false); }
  };

  const updateTask = (taskId: string, update: Partial<PlannerTask>, persist = true) => {
    const roadmap = { ...plan.roadmap, weeks: plan.roadmap.weeks.map((item, index) => index === selectedWeek ? { ...item, tasks: item.tasks.map((task) => task.id === taskId ? { ...task, ...update } : task) } : item) };
    if (persist) void saveRoadmap(roadmap);
    else onPlanChange({ ...plan, roadmap });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: PlannerTask = { id: `personal-${Date.now()}`, subject: "Personal", chapter: "My notes", title: newTask.trim(), durationMinutes: 45, day: "Flexible", isCompleted: false, note: "", isPersonal: true };
    const roadmap = { ...plan.roadmap, weeks: plan.roadmap.weeks.map((item, index) => index === selectedWeek ? { ...item, tasks: [...item.tasks, task] } : item) };
    setNewTask("");
    void saveRoadmap(roadmap, "Personal task added");
  };

  const removeTask = (taskId: string) => {
    const roadmap = { ...plan.roadmap, weeks: plan.roadmap.weeks.map((item, index) => index === selectedWeek ? { ...item, tasks: item.tasks.filter((task) => task.id !== taskId) } : item) };
    void saveRoadmap(roadmap);
  };

  const rebuildRoadmap = async () => {
    try {
      setRebuilding(true);
      const response = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: plan.grade,
          board: plan.board || undefined,
          examName: plan.examName,
          examDate: plan.examDate.slice(0, 10),
          subjects: plan.subjects,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
      const updated = await response.json();
      onPlanChange({ ...updated, subjects: updated.subjects, roadmap: updated.roadmap });
      setSelectedWeek(0);
      toast.success("Roadmap rebuilt with LMS materials and practice");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not rebuild roadmap");
    } finally {
      setRebuilding(false);
    }
  };

  return <div className="mx-auto w-full max-w-6xl space-y-3 px-3 pb-24 pt-3 sm:space-y-6 sm:px-6 sm:py-6 lg:py-8">
    <div className="rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 p-3.5 text-white shadow-sm sm:rounded-2xl sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"><div><div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-semibold text-blue-100 sm:mb-3 sm:gap-2 sm:text-xs"><Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />YOUR PERSONAL ROADMAP</div><h1 className="text-lg font-bold sm:text-2xl">{plan.examName}</h1><p className="mt-0.5 text-[11px] text-blue-100 sm:mt-1 sm:text-sm">{plan.board ? `${plan.board} · ` : ""}{plan.grade} · Exam on {new Date(plan.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><Button onClick={rebuildRoadmap} disabled={rebuilding} size="sm" className="h-8 bg-white text-[11px] text-blue-700 hover:bg-blue-50 sm:h-9 sm:text-sm">{rebuilding ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1.5 h-3.5 w-3.5" />}Rebuild</Button><Button onClick={onEdit} size="sm" className="h-8 bg-white/15 text-[11px] text-white hover:bg-white/25 sm:h-9 sm:text-sm"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Adjust</Button></div></div><div className="mt-3 sm:mt-6"><div className="mb-1.5 flex justify-between text-[10px] sm:mb-2 sm:text-xs"><span>{progress.completed} of {progress.total} tasks complete</span><span>{progress.percentage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/20 sm:h-2"><motion.div className="h-full rounded-full bg-white" animate={{ width: `${progress.percentage}%` }} /></div></div></div>
    <div className="grid gap-3 lg:grid-cols-[230px_1fr] lg:gap-6"><aside className="sticky top-16 z-20 -mx-3 border-y bg-background/95 px-3 py-2 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0"><div className="lg:hidden"><Select value={String(selectedWeek)} onValueChange={(value) => setSelectedWeek(Number(value))}><SelectTrigger className="h-10 w-full rounded-lg bg-background text-xs font-semibold"><SelectValue aria-label={`Selected ${week.label}`} /></SelectTrigger><SelectContent>{plan.roadmap.weeks.map((item, index) => <SelectItem key={item.weekNumber} value={String(index)}><span className="flex w-full items-center justify-between gap-5"><span>{item.label}</span><span className="text-muted-foreground">{item.tasks.filter((task) => task.isCompleted).length}/{item.tasks.length} complete</span></span></SelectItem>)}</SelectContent></Select></div><div className="hidden lg:block"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Your weeks</p><div className="space-y-2">{plan.roadmap.weeks.map((item, index) => <button key={item.weekNumber} onClick={() => setSelectedWeek(index)} className={cn("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition", selectedWeek === index ? "bg-blue-600 font-semibold text-white shadow-sm" : "bg-background hover:bg-slate-100 dark:hover:bg-white/5")}><span>{item.label}</span><span className={cn("text-xs", selectedWeek === index ? "text-blue-100" : "text-slate-400")}>{item.tasks.filter((task) => task.isCompleted).length}/{item.tasks.length}</span></button>)}</div></div></aside>
      <main className="min-w-0"><div className="mb-3 flex items-end justify-between sm:mb-4"><div><h2 className="text-lg font-semibold sm:text-xl">{week.label}</h2><p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{new Date(`${week.startDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(`${week.endDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>{saving && <span className="flex items-center gap-1 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" />Saving</span>}</div>
        <div className="mb-3 flex gap-2 rounded-xl border border-dashed border-slate-300 p-2 dark:border-white/15 sm:mb-4 sm:p-3"><Input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTask()} placeholder="Add your own task or note…" className="h-9 min-w-0 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0 sm:px-3 sm:text-sm" /><Button size="sm" onClick={addTask} disabled={!newTask.trim()}><Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Add</span></Button></div>
        <div className="space-y-2 sm:space-y-3">{week.tasks.map((task) => <motion.div layout key={task.id} className={cn("group overflow-hidden rounded-xl border p-2.5 transition sm:p-4", task.isCompleted ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-slate-200 bg-white hover:border-blue-200 dark:border-white/10 dark:bg-slate-950")}><div className="flex gap-2.5 sm:gap-3"><button onClick={() => updateTask(task.id, { isCompleted: !task.isCompleted })} className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition", task.isCompleted ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 hover:border-blue-500")} aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}>{task.isCompleted && <Check className="h-3 w-3" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className={cn("text-[13px] font-semibold leading-5 sm:text-sm", task.isCompleted && "text-slate-500 line-through")}>{task.title}</p><p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">{task.subject} · {task.day} · {task.durationMinutes} min</p></div>{task.isPersonal && <button onClick={() => removeTask(task.id)} className="text-slate-400 transition hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>}</div><TaskResources resources={task.resources} /><TaskNote task={task} onSave={(note) => updateTask(task.id, { note })} /></div></div></motion.div>)}</div>
      </main></div>
  </div>;
};
