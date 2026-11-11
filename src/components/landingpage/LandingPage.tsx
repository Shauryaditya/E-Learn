import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  BrainCircuit,
  Check,
  ClipboardCheck,
  FileArchive,
  FileText,
  GraduationCap,
  LibraryBig,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const platformFeatures = [
  {
    icon: BookOpenCheck,
    label: "Test series",
    title: "Practise with structured tests",
    description: "Attempt chapter-wise and exam-style papers, submit handwritten answers, and review detailed feedback.",
    accent: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  {
    icon: Trophy,
    label: "Live contests",
    title: "Compete in timed contests",
    description: "Register for scheduled contests, attempt objective and subjective questions, and compare your performance.",
    accent: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  },
  {
    icon: LibraryBig,
    label: "Learning materials",
    title: "Notes and assignments together",
    description: "Study teacher-curated notes, worksheets, videos, and assignments from one organised learning space.",
    accent: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  },
  {
    icon: FileArchive,
    label: "Paper Vault",
    title: "Find previous-year papers",
    description: "Browse school and board papers by class, subject, exam type, and year without digging through groups.",
    accent: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    icon: BrainCircuit,
    label: "AI study support",
    title: "Find what to study next",
    description: "Use AI-assisted discovery for relevant notes, assignments, explanations, and personalised study guidance.",
    accent: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  },
  {
    icon: LineChart,
    label: "Progress",
    title: "Understand every result",
    description: "See scores, correct answers, mistakes, teacher feedback, goals, and learning activity in one dashboard.",
    accent: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  },
];

const studentSteps = [
  { number: "01", title: "Choose your goal", description: "Select your class, board, subjects, and the exam you are preparing for." },
  { number: "02", title: "Learn and practise", description: "Use notes, assignments, test series, contests, and previous-year papers." },
  { number: "03", title: "Review and improve", description: "Track scores, revisit mistakes, and act on teacher feedback." },
];

const boardLabels = ["CBSE", "ICSE", "ISC", "State boards", "Classes 6–12"];

const quickTools = [
  { label: "Notes", icon: FileText },
  { label: "Paper Vault", icon: FileArchive },
  { label: "AI Finder", icon: Sparkles },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Aaccent home">
      <Image src="/icon.png" width={32} height={32} alt="" className="h-8 w-8 rounded-lg" priority />
      <div className="leading-none">
        <p className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">Aaccent</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">E-Learn</p>
      </div>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:mx-0 lg:ml-auto">
      <div className="absolute -inset-6 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">Student workspace</span>
        </div>
        <div className="grid min-h-[350px] grid-cols-[64px_1fr] sm:grid-cols-[132px_1fr]">
          <aside className="border-r border-slate-100 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="mb-5 hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white"><GraduationCap className="h-4 w-4" /></div>
              <span className="text-xs font-semibold">Aaccent</span>
            </div>
            <div className="space-y-2">
              {[BarChart3, Search, BookOpenCheck, Trophy, FileText].map((Icon, index) => (
                <div key={index} className={`flex h-9 items-center gap-2 rounded-md px-2 ${index === 0 ? "bg-blue-600 text-white" : "text-slate-400"}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden text-[10px] font-medium sm:inline">{["Dashboard", "Browse", "Test series", "Contests", "Resources"][index]}</span>
                </div>
              ))}
            </div>
          </aside>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium text-blue-600">WELCOME BACK</p>
                <h3 className="mt-1 text-sm font-semibold sm:text-base">Your learning dashboard</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"><Bell className="h-3.5 w-3.5" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
                <p className="text-[10px] text-slate-500">Study streak</p>
                <p className="mt-2 text-xl font-bold">6 days</p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full w-3/4 rounded-full bg-blue-600" /></div>
              </div>
              <div className="rounded-lg border border-slate-100 p-3 dark:border-white/10">
                <p className="text-[10px] text-slate-500">Average score</p>
                <p className="mt-2 text-xl font-bold">78%</p>
                <p className="mt-3 text-[10px] font-medium text-emerald-600">↑ Improving</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-slate-100 p-3 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-slate-500">UP NEXT</p>
                  <p className="mt-1 text-xs font-semibold">Class 10 Science contest</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Tomorrow</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500"><Target className="h-3.5 w-3.5" /> Electricity · 45 minutes · 30 marks</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {quickTools.map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-white/[0.04]">
                  <Icon className="mx-auto h-3.5 w-3.5 text-blue-600" />
                  <p className="mt-2 text-[9px] font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcfe] text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#fbfcfe]/90 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <Link href="#platform" className="text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">Platform</Link>
            <Link href="#students" className="text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">For students</Link>
            <Link href="#teachers" className="text-xs font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">For teachers</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden rounded-md px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex">Sign in</Link>
            <Link href="/sign-up" className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700">Start learning <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>

      <section className="relative border-b border-slate-200/80 dark:border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:py-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <GraduationCap className="h-3.5 w-3.5" /> Built for Indian students in Classes 6–12
            </div>
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.12] tracking-[-0.035em] sm:text-5xl">
              Learn, practise and improve—all in one place.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-[15px]">
              Aaccent brings together notes, assignments, test series, live contests, previous-year papers, and useful feedback for school students.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700">Start learning for free <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
              <Link href="#platform" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-xs font-semibold transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10">Explore the platform</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" /> Free to get started</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Teacher-led learning</span>
              <span className="inline-flex items-center gap-1.5"><BrainCircuit className="h-3.5 w-3.5 text-emerald-600" /> AI-assisted tools</span>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950" aria-label="Supported education systems">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Designed around Indian school learning</p>
          <div className="flex flex-wrap gap-2">
            {boardLabels.map((item) => <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">{item}</span>)}
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Platform overview</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Everything needed beyond the classroom.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Clear tools for learning, practising, assessment, and improvement—without unnecessary complexity.</p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature) => (
            <article key={feature.label} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-white/20">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${feature.accent}`}><feature.icon className="h-4 w-4" /></div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{feature.label}</p>
              <h3 className="mt-2 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="students" className="border-y border-slate-200/80 bg-white dark:border-white/10 dark:bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">For students</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">A simple path from preparation to progress.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Spend less time searching across chats, drives, and websites. Keep preparation organised in one workspace.</p>
              <Link href="/sign-up" className="mt-6 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700">Create your student account <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
              {studentSteps.map((step) => (
                <div key={step.number} className="grid grid-cols-[42px_1fr] gap-4 py-5 sm:grid-cols-[56px_1fr]">
                  <span className="text-xs font-semibold tabular-nums text-blue-600">{step.number}</span>
                  <div><h3 className="text-sm font-semibold">{step.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-slate-400">{step.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white dark:border-white/10 lg:grid-cols-2">
          <div className="p-6 sm:p-9">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><ClipboardCheck className="h-4 w-4 text-cyan-300" /></div>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Answer evaluation</p>
            <h2 className="mt-3 max-w-md text-2xl font-bold tracking-tight">Upload handwritten work. Get feedback that helps.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">Submit answer-sheet images or PDFs, receive marks and teacher feedback, and review annotated work instead of seeing only a final score.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Image and PDF submissions", "Teacher annotations", "Marks with feedback", "Submission history"].map((item) => <div key={item} className="flex items-center gap-2 text-xs text-slate-300"><Check className="h-3.5 w-3.5 text-cyan-300" />{item}</div>)}
            </div>
          </div>
          <div className="border-t border-white/10 bg-white/[0.04] p-6 sm:p-9 lg:border-l lg:border-t-0">
            <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
              <div className="flex items-center justify-between"><p className="text-xs font-semibold">Physics answer sheet</p><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold text-emerald-300">Reviewed</span></div>
              <div className="mt-4 rounded-lg bg-white p-4 text-slate-900">
                <p className="text-[10px] font-semibold">Q3. Explain Ohm&apos;s law with a graph.</p>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-5/6 rounded bg-slate-200" /><div className="h-2 w-full rounded bg-slate-200" /><div className="h-2 w-3/5 rounded bg-slate-200" />
                </div>
                <div className="mt-4 rounded-md border-l-2 border-emerald-500 bg-emerald-50 p-2.5"><p className="text-[9px] font-semibold text-emerald-800">Teacher feedback</p><p className="mt-1 text-[9px] leading-4 text-emerald-700">Correct definition and graph. Label both axes clearly.</p></div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-400">Question score</span><span className="font-semibold text-white">4 / 5</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="teachers" className="border-y border-slate-200/80 bg-blue-50/60 dark:border-white/10 dark:bg-blue-950/20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">For teachers</p>
            <h2 className="mt-3 max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">Publish, assess and understand student performance.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">Create learning materials, test series, and contests. Review submissions, share feedback, and use focused analytics without managing everything from one crowded page.</p>
            <Link href="/sign-in" className="mt-6 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">Open teacher workspace <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: FileText, title: "Content management", text: "Organise notes, assignments, chapters, and attachments." },
              { icon: ClipboardCheck, title: "Submission review", text: "Grade handwritten work with marks, feedback, and annotations." },
              { icon: Users, title: "Student access", text: "Manage enrolments and registered contest participants." },
              { icon: BarChart3, title: "Separate analytics", text: "Review courses, test series, and contest performance independently." },
            ].map((item) => <div key={item.title} className="rounded-xl border border-blue-100 bg-white p-5 dark:border-blue-900/50 dark:bg-slate-950"><item.icon className="h-4 w-4 text-blue-600" /><h3 className="mt-4 text-sm font-semibold">{item.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{item.text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-white/10 dark:bg-white/[0.025] sm:px-10 sm:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Start today</p>
          <h2 className="mx-auto mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">A clearer way to prepare for school exams.</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">Build your routine, practise consistently, and understand what to improve next.</p>
          <Link href="/sign-up" className="mt-7 inline-flex h-10 items-center rounded-md bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700">Get started for free <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Brand />
          <p className="max-w-md text-xs leading-5 text-slate-500">Learning, practice, assessment, and feedback for Indian school students.</p>
          <div className="flex items-center gap-5 text-xs text-slate-500"><Link href="/sign-in" className="hover:text-slate-950 dark:hover:text-white">Sign in</Link><Link href="/sign-up" className="hover:text-slate-950 dark:hover:text-white">Create account</Link></div>
        </div>
      </footer>
    </main>
  );
}
