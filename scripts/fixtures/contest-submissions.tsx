import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import Link from "next/link";
import { ContestWorkspaceNav } from "../../src/app/(dashboard)/(routes)/teacher/contests/[contestId]/_components/contest-workspace-nav";
import { ContestSubmissionsList } from "../../src/app/(dashboard)/(routes)/teacher/contests/[contestId]/_components/contest-submissions-list";
import { ContestAttemptReview } from "../../src/app/(dashboard)/(routes)/teacher/contests/[contestId]/_components/contest-attempts-review";
import { parseSubmissionParams, submissionsHref } from "../../src/lib/contest-submissions";
import { TeacherDashboardView } from "../../src/app/(dashboard)/(routes)/teacher/dashboard/_components/teacher-dashboard-view";
import { TeacherAnalyticsView } from "../../src/app/(dashboard)/(routes)/teacher/analytics/_components/teacher-analytics-view";
import { SidebarRoutes } from "../../src/app/(dashboard)/_components/sidebar-routes";
import { MobileBottomNav } from "../../src/app/(dashboard)/_components/mobile-bottom-nav";
import { StudentContestResults } from "../../src/app/(dashboard)/(routes)/contests/[contestId]/_components/student-contest-results";

const now = new Date("2026-09-07T12:00:00Z");
const params = parseSubmissionParams(Object.fromEntries(new URLSearchParams(window.location.search)));
const base = "/teacher/contests/demo/submissions";
const router = {
  back() { window.history.back(); }, forward() { window.history.forward(); },
  refresh() { window.location.reload(); }, push(href: string) { window.location.assign(href); },
  replace(href: string) { window.location.replace(href); }, async prefetch() {},
};
const students = Object.fromEntries(Array.from({ length: 41 }, (_, index) => [`student-${index + 1}`, {
  name: `Student ${index + 1}`, email: `student${index + 1}@example.com`,
}]));
const all = Array.from({ length: 41 }, (_, index) => ({
  id: `registration-${index + 1}`, userId: `student-${index + 1}`,
  status: "REGISTERED" as const, createdAt: now,
  attempt: {
    status: "SUBMITTED" as const, score: 4, totalMarks: 10, submittedAt: now,
    expiresAt: now, answers: [{ id: `pending-${index + 1}` }],
  },
}));
const matching = params.q ? all.filter(item => students[item.userId].email === params.q || item.userId.includes(params.q)) : all;
const registrations = matching.slice((params.page - 1) * 20, params.page * 20);
const id = window.location.pathname.split("/").pop() || "";
const registration = all.find(item => item.id === id);
const back = submissionsHref("demo", params);
const questions = [
  { position: 1, marks: 4, question: { id: "q1", questionText: "Which quantity is conserved in an isolated system?", questionType: "SINGLE_CHOICE" as const, defaultMarks: 4,
    options: [{ id: "a", optionText: "Total energy", isCorrect: true, position: 1 }] } },
  { position: 2, marks: 6, question: { id: "q2", questionText: "Explain your reasoning.", questionType: "NUMERICAL" as const, defaultMarks: 6, options: [] } },
];
const resultQuestions = [
  {
    position: 1, marks: 4,
    question: {
      id: "q1", questionText: "Which quantity is conserved in an isolated system?", questionType: "SINGLE_CHOICE" as const,
      defaultMarks: 4, imageUrl: null, explanation: "Energy can change form, but the total remains constant.",
      options: [
        { id: "a", optionText: "Total energy", isCorrect: true, position: 1 },
        { id: "b", optionText: "Temperature", isCorrect: false, position: 2 },
      ],
    },
  },
  {
    position: 2, marks: 3,
    question: {
      id: "q2", questionText: "Which value represents acceleration due to gravity?", questionType: "SINGLE_CHOICE" as const,
      defaultMarks: 3, imageUrl: null, explanation: "Near Earth's surface, g is approximately 9.8 m/s^2.",
      options: [
        { id: "c", optionText: "9.8 m/s^2", isCorrect: true, position: 1 },
        { id: "d", optionText: "3.0 x 10^8 m/s", isCorrect: false, position: 2 },
      ],
    },
  },
  {
    position: 3, marks: 3,
    question: {
      id: "q3", questionText: "Explain why momentum is conserved.", questionType: "NUMERICAL" as const,
      defaultMarks: 3, imageUrl: null, explanation: null, options: [],
    },
  },
];
const resultAttempt = {
  score: 4, totalMarks: 10, percentage: 40,
  answers: [
    { questionId: "q1", selectedAnswer: "a", isCorrect: true, marksAwarded: 4 },
    { questionId: "q2", selectedAnswer: "d", isCorrect: false, marksAwarded: 0 },
    { questionId: "q3", selectedAnswer: "", isCorrect: null, marksAwarded: null },
  ],
};
const empty = new URLSearchParams(window.location.search).has("empty");
const dashboardData = {
  courses: empty ? 0 : 8, testSeries: empty ? 0 : 3, activeAttempts: empty ? 0 : 24, pendingReviews: empty ? 0 : 12,
  upcoming: empty ? [] : [
    { id: "physics", title: "Class 12 Physics: Weekly Assessment", startsAt: new Date("2026-09-08T10:00:00Z"), durationMinutes: 60, _count: { registrations: 48 } },
    { id: "maths", title: "Class 10 Mathematics: Quadratic Equations", startsAt: new Date("2026-09-10T11:00:00Z"), durationMinutes: 45, _count: { registrations: 32 } },
  ],
  reviewContests: empty ? [] : [
    { id: "demo", title: "Mechanics and Motion", _count: { attempts: 8 } },
    { id: "chemistry", title: "Organic Chemistry: Chapter Review", _count: { attempts: 4 } },
  ],
  recentContent: empty ? [] : [
    { id: "one", title: "Physics for Class 12", imageUrl: "/cover.png", isPublished: true, updatedAt: now, kind: "Course" as const, href: "/teacher/courses/one" },
    { id: "two", title: "CBSE Class 10 Mathematics", imageUrl: null, isPublished: false, updatedAt: now, kind: "Test series" as const, href: "/teacher/testseries/two" },
  ],
};
const analyticsView = (new URLSearchParams(window.location.search).get("view") || "courses") as "courses" | "test-series" | "contests";
const analyticsData = {
  courses: {
    view: "courses" as const,
    metrics: [
      { label: "Published courses", value: 6, detail: "8 total" },
      { label: "Course enrollments", value: 124, detail: "Completed purchases" },
      { label: "Assignment submissions", value: 39, detail: "7 awaiting review" },
      { label: "Sales value", value: 48200, format: "currency" as const, detail: "Using current course prices" },
    ],
    rows: [
      { id: "one", name: "Physics for Class 12", href: "/teacher/courses/one", status: "Published", primary: 68, secondary: 12, value: 27200 },
      { id: "two", name: "CBSE Class 10 Mathematics", href: "/teacher/courses/two", status: "Draft", primary: 56, secondary: 9, value: 21000 },
    ],
    labels: { primary: "Enrollments", secondary: "Chapters", value: "Sales value" },
  },
  "test-series": {
    view: "test-series" as const,
    metrics: [
      { label: "Published series", value: 3, detail: "4 total" },
      { label: "Test attempts", value: 212, detail: "184 completed" },
      { label: "Completion rate", value: 86.8, format: "percentage" as const, detail: "18 descriptive submissions" },
      { label: "Average score", value: 71.4, format: "percentage" as const, detail: "4 awaiting review" },
    ],
    rows: [{ id: "series", name: "JEE Foundation Practice", href: "/teacher/testseries/series", status: "Published", primary: 212, secondary: 86.8, value: 71.4 }],
    labels: { primary: "Attempts", secondary: "Completion", value: "Average score" },
    percentageColumns: ["secondary", "value"],
  },
  contests: {
    view: "contests" as const,
    metrics: [
      { label: "Registrations", value: 96, detail: "5 contests" },
      { label: "Started attempts", value: 81, detail: "24 active now" },
      { label: "Participation rate", value: 84.4, format: "percentage" as const, detail: "57 submitted" },
      { label: "Average score", value: 67.5, format: "percentage" as const, detail: "12 awaiting grading" },
    ],
    rows: [{ id: "demo", name: "Mechanics and Motion", href: "/teacher/contests/demo/submissions", status: "Published", primary: 48, secondary: 87.5, value: 67.5 }],
    labels: { primary: "Registrations", secondary: "Participation", value: "Average score" },
    percentageColumns: ["secondary", "value"],
  },
}[analyticsView];
createRoot(document.getElementById("root")!).render(
  <AppRouterContext.Provider value={router}>
    <PathnameContext.Provider value={window.location.pathname}>
      {window.location.pathname === "/contests/demo" ? (
        <main className="mx-auto min-w-0 max-w-4xl bg-background px-4 py-6 text-foreground">
          <StudentContestResults attempt={resultAttempt} questions={resultQuestions} />
        </main>
      ) : window.location.pathname === "/teacher/dashboard" ? <>
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background px-3 md:block">
          <div className="flex h-16 items-center gap-3 px-3"><img src="/logo.png" alt="Aaccent" className="h-8 w-8" /><span className="font-semibold">Aaccent E-Learn</span></div>
          <SidebarRoutes />
        </aside>
        <main className="min-w-0 pb-24 md:pb-0 md:pl-64"><TeacherDashboardView data={dashboardData} now={now} /></main>
        <MobileBottomNav />
      </> : window.location.pathname === "/teacher/analytics" ? <>
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background px-3 md:block">
          <div className="flex h-16 items-center gap-3 px-3"><img src="/logo.png" alt="Aaccent" className="h-8 w-8" /><span className="font-semibold">Aaccent E-Learn</span></div>
          <SidebarRoutes />
        </aside>
        <main className="min-w-0 pb-24 md:pb-0 md:pl-64"><TeacherAnalyticsView data={analyticsData} /></main>
        <MobileBottomNav />
      </> : <div className="mx-auto min-w-0 max-w-6xl bg-background text-foreground">
        <header className="space-y-4 px-4 pt-6 sm:px-6">
          <h1 className="text-2xl font-semibold">Class 12 Physics: Weekly Assessment</h1>
          <ContestWorkspaceNav contestId="demo" />
        </header>
        {registration ? <div className="space-y-5 p-4 sm:p-6">
          <Link href={back}>Back to submissions</Link>
          <ContestAttemptReview student={students[registration.userId]} now={now} questions={questions}
            registration={{ ...registration, attempt: { ...registration.attempt, startedAt: now,
              answers: [
                { questionId: "q1", selectedAnswer: "a", isCorrect: true, marksAwarded: 4 },
                { questionId: "q2", selectedAnswer: "Energy changes form but is conserved.\nFor example, a falling object exchanges potential and kinetic energy.", isCorrect: null, marksAwarded: null },
              ],
            } }} />
        </div> : <ContestSubmissionsList contestId="demo" now={now} students={students}
          data={{ registrations, params, total: matching.length, pageCount: Math.max(1, Math.ceil(matching.length / 20)) }} />}
      </div>}
    </PathnameContext.Provider>
  </AppRouterContext.Provider>,
);
