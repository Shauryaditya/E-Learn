"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  ExternalLink,
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

const GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Computer Science", "History", "Geography", "Accountancy", "Economics", "Business Studies"];
const STEP_LABELS = ["Goal", "Subjects", "Chapters", "Weekly time", "Review"];

type InitialPlan = {
  id: string;
  grade: string;
  examName: string;
  examDate: string;
  weeklyMinutes: number;
  subjects: PlannerSubject[];
  roadmap: PlannerRoadmap;
};

type StudyPlannerProps = {
  profile: { grade: string | null; subjects: string[]; targetExam: string | null } | null;
  initialPlan: InitialPlan | null;
};

const inputClass = "h-11 rounded-xl border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-slate-950";
const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60 ? `${minutes % 60}m` : ""}`.trim();

export const StudyPlanner = ({ profile, initialPlan }: StudyPlannerProps) => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [plan, setPlan] = useState(initialPlan);
  const [editing, setEditing] = useState(!initialPlan);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [grade, setGrade] = useState(initialPlan?.grade || profile?.grade || "");
  const [examName, setExamName] = useState(initialPlan?.examName || profile?.targetExam || "");
  const [examDate, setExamDate] = useState(initialPlan?.examDate.slice(0, 10) || "");
  const [subjects, setSubjects] = useState<PlannerSubject[]>(
    initialPlan?.subjects || (profile?.subjects || []).map((name) => ({ name, weeklyMinutes: 120, chapters: [] }))
  );

  const totalMinutes = subjects.reduce((total, subject) => total + subject.weeklyMinutes, 0);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(grade && examName.trim() && examDate && examDate >= tomorrow);
    if (step === 1) return subjects.length > 0;
    if (step === 2) return subjects.every((subject) => subject.chapters.length > 0);
    return true;
  }, [step, grade, examName, examDate, subjects, tomorrow]);

  const toggleSubject = (name: string) => {
    setSubjects((current) => current.some((subject) => subject.name === name)
      ? current.filter((subject) => subject.name !== name)
      : [...current, { name, weeklyMinutes: 120, chapters: [] }]);
  };

  const updateSubject = (name: string, update: Partial<PlannerSubject>) => {
    setSubjects((current) => current.map((subject) => subject.name === name ? { ...subject, ...update } : subject));
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
        body: JSON.stringify({ grade, examName, examDate, subjects }),
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
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-7">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" /> Personal study planner
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Build a plan around your exam</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Tell us where you need help and how much time you have. We will turn it into a practical weekly roadmap that you can adjust anytime.</p>
      </header>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>{STEP_LABELS[step]}</span><span>{step + 1} of {STEP_LABELS.length}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div className="h-full rounded-full bg-blue-600" animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
      </div>

      <div className="min-h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={step} custom={direction} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -18 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {step === 0 && <GoalStep grade={grade} setGrade={setGrade} examName={examName} setExamName={setExamName} examDate={examDate} setExamDate={setExamDate} minDate={tomorrow} />}
            {step === 1 && <SubjectsStep subjects={subjects} toggleSubject={toggleSubject} />}
            {step === 2 && <ChaptersStep subjects={subjects} updateSubject={updateSubject} />}
            {step === 3 && <TimeStep subjects={subjects} updateSubject={updateSubject} totalMinutes={totalMinutes} />}
            {step === 4 && <ReviewStep grade={grade} examName={examName} examDate={examDate} subjects={subjects} totalMinutes={totalMinutes} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-between">
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
  <div className="mb-7 flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950"><Icon className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div></div>
);

const GoalStep = ({ grade, setGrade, examName, setExamName, examDate, setExamDate, minDate }: any) => (
  <div><StepHeading icon={Target} title="What are you preparing for?" description="This gives your roadmap a clear finish line." /><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2 text-sm font-medium"><span>Your class</span><Select value={grade} onValueChange={setGrade}><SelectTrigger className={inputClass}><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{GRADES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><label className="space-y-2 text-sm font-medium">Exam or goal<Input value={examName} onChange={(event) => setExamName(event.target.value)} placeholder="e.g. Class 10 boards" className={inputClass} /></label><div className="space-y-2 text-sm font-medium sm:col-span-2"><span>Examination date</span><DatePicker value={examDate} onChange={setExamDate} minDate={new Date(`${minDate}T00:00:00`)} placeholder="Select examination date" className="h-11 max-w-sm rounded-xl" /></div></div></div>
);

const SubjectsStep = ({ subjects, toggleSubject }: { subjects: PlannerSubject[]; toggleSubject: (name: string) => void }) => (
  <div><StepHeading icon={BookOpenCheck} title="Where would you like guidance?" description="Choose only the subjects that need a structured plan." /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{SUBJECTS.map((name) => { const selected = subjects.some((subject) => subject.name === name); return <button type="button" key={name} onClick={() => toggleSubject(name)} className={cn("flex min-h-16 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5", selected ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm dark:bg-blue-950/40 dark:text-blue-200" : "border-slate-200 hover:border-blue-300 dark:border-white/10")}><span>{name}</span>{selected && <Check className="h-4 w-4" />}</button>; })}</div></div>
);

const ChaptersStep = ({ subjects, updateSubject }: { subjects: PlannerSubject[]; updateSubject: (name: string, update: Partial<PlannerSubject>) => void }) => {
  const [chapterDrafts, setChapterDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(subjects.map((subject) => [subject.name, subject.chapters.join(", ")]))
  );

  const handleChapterChange = (subjectName: string, value: string) => {
    setChapterDrafts((current) => ({ ...current, [subjectName]: value }));
    updateSubject(subjectName, {
      chapters: value
        .split(",")
        .map((chapter) => chapter.trim())
        .filter(Boolean),
    });
  };

  return (
    <div>
      <StepHeading icon={BookOpenCheck} title="Which chapters need attention?" description="Separate chapter names with commas. You can change them later." />
      <div className="space-y-4">
        {subjects.map((subject) => (
          <label key={subject.name} className="block space-y-2">
            <span className="text-sm font-semibold">{subject.name}</span>
            <textarea
              value={chapterDrafts[subject.name] ?? ""}
              onChange={(event) => handleChapterChange(subject.name, event.target.value)}
              placeholder="e.g. Trigonometry, Statistics, Probability"
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-slate-950"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

const TimeStep = ({ subjects, updateSubject, totalMinutes }: { subjects: PlannerSubject[]; updateSubject: (name: string, update: Partial<PlannerSubject>) => void; totalMinutes: number }) => (
  <div><StepHeading icon={Clock3} title="How much time can you commit?" description="Choose a realistic weekly target for each subject." /><div className="space-y-5">{subjects.map((subject) => <div key={subject.name} className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">{subject.name}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{formatMinutes(subject.weeklyMinutes)} / week</span></div><input type="range" min="30" max="600" step="30" value={subject.weeklyMinutes} onChange={(event) => updateSubject(subject.name, { weeklyMinutes: Number(event.target.value) })} className="w-full accent-blue-600" /></div>)}<div className="text-right text-sm text-slate-500">Total commitment: <strong className="text-slate-900 dark:text-white">{formatMinutes(totalMinutes)} per week</strong></div></div></div>
);

const ReviewStep = ({ grade, examName, examDate, subjects, totalMinutes }: { grade: string; examName: string; examDate: string; subjects: PlannerSubject[]; totalMinutes: number }) => (
  <div><StepHeading icon={Sparkles} title="Ready to build your roadmap" description="We will spread the chapters across the time available and reserve the final week for revision." /><div className="grid gap-4 sm:grid-cols-3"><SummaryCard icon={Target} label="Goal" value={`${examName} · ${grade}`} /><SummaryCard icon={CalendarDays} label="Exam date" value={new Date(`${examDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} /><SummaryCard icon={Clock3} label="Weekly time" value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} /></div><div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Subjects and chapters</p>{subjects.map((subject) => <div key={subject.name} className="border-b border-slate-200 py-3 last:border-0 dark:border-white/10"><p className="text-sm font-semibold">{subject.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{subject.chapters.join(" · ")}</p></div>)}</div></div>
);

const SummaryCard = ({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) => <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10"><Icon className="mb-3 h-5 w-5 text-blue-600" /><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;

const TaskResources = ({ resources }: { resources?: PlannerResource[] }) => {
  if (!resources?.length) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {resources.map((resource) => {
        const Icon = resource.kind === "LEARNING_MATERIAL" ? FileText : ListChecks;
        return (
          <Link
            key={`${resource.kind}-${resource.id}`}
            href={resource.href}
            className="group/resource flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", resource.kind === "LEARNING_MATERIAL" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300")}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{resource.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{resource.context}</p>
              <span className="mt-1 inline-flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                {!resource.hasAccess && <LockKeyhole className="mr-1 h-3 w-3" />}
                {resource.hasAccess ? (resource.kind === "LEARNING_MATERIAL" ? "Open material" : "Start practice") : "View recommendation"}
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
    <div className="mt-3 flex items-end gap-2 rounded-lg bg-slate-50 p-2 dark:bg-white/[0.03]">
      <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} autoFocus placeholder="Your reminder or personal note" className="min-h-14 flex-1 resize-none border-0 bg-transparent p-1 text-xs outline-none" />
      <div className="flex gap-1">
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

  return <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
    <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 p-5 text-white shadow-sm sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-blue-100"><Sparkles className="h-3.5 w-3.5" />YOUR PERSONAL ROADMAP</div><h1 className="text-2xl font-bold">{plan.examName}</h1><p className="mt-1 text-sm text-blue-100">{plan.grade} · Exam on {new Date(plan.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div><div className="flex flex-wrap gap-2"><Button onClick={rebuildRoadmap} disabled={rebuilding} className="bg-white text-blue-700 hover:bg-blue-50">{rebuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}Rebuild roadmap</Button><Button onClick={onEdit} className="bg-white/15 text-white hover:bg-white/25"><Edit3 className="mr-2 h-4 w-4" />Adjust plan</Button></div></div><div className="mt-6"><div className="mb-2 flex justify-between text-xs"><span>{progress.completed} of {progress.total} tasks complete</span><span>{progress.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/20"><motion.div className="h-full rounded-full bg-white" animate={{ width: `${progress.percentage}%` }} /></div></div></div>
    <div className="grid gap-6 lg:grid-cols-[230px_1fr]"><aside className="space-y-2"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Your weeks</p>{plan.roadmap.weeks.map((item, index) => <button key={item.weekNumber} onClick={() => setSelectedWeek(index)} className={cn("flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition", selectedWeek === index ? "bg-blue-600 font-semibold text-white shadow-sm" : "hover:bg-slate-100 dark:hover:bg-white/5")}><span>{item.label}</span><span className={cn("text-xs", selectedWeek === index ? "text-blue-100" : "text-slate-400")}>{item.tasks.filter((task) => task.isCompleted).length}/{item.tasks.length}</span></button>)}</aside>
      <main><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-semibold">{week.label}</h2><p className="mt-1 text-xs text-slate-500">{new Date(`${week.startDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – {new Date(`${week.endDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>{saving && <span className="flex items-center gap-1 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" />Saving</span>}</div>
        <div className="mb-4 flex gap-2 rounded-xl border border-dashed border-slate-300 p-3 dark:border-white/15"><Input value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTask()} placeholder="Add your own task or note…" className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0" /><Button size="sm" onClick={addTask} disabled={!newTask.trim()}><Plus className="mr-1 h-4 w-4" />Add</Button></div>
        <div className="space-y-3">{week.tasks.map((task) => <motion.div layout key={task.id} className={cn("group rounded-xl border p-4 transition", task.isCompleted ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-slate-200 bg-white hover:border-blue-200 dark:border-white/10 dark:bg-slate-950")}><div className="flex gap-3"><button onClick={() => updateTask(task.id, { isCompleted: !task.isCompleted })} className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition", task.isCompleted ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 hover:border-blue-500")} aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}>{task.isCompleted && <Check className="h-3 w-3" />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className={cn("text-sm font-semibold", task.isCompleted && "text-slate-500 line-through")}>{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.subject} · {task.day} · {task.durationMinutes} min</p></div>{task.isPersonal && <button onClick={() => removeTask(task.id)} className="text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>}</div><TaskResources resources={task.resources} /><TaskNote task={task} onSave={(note) => updateTask(task.id, { note })} /></div></div></motion.div>)}</div>
      </main></div>
  </div>;
};
