import type { Prisma, PrismaClient } from "@prisma/client";

export const SUBMISSIONS_PAGE_SIZE = 20;
export const submissionFilters = {
  all: "All students",
  not_started: "Not started",
  in_progress: "In progress",
  expired: "Time expired",
  submitted: "Submitted",
  needs_grading: "Awaiting grading",
  evaluated: "Evaluated",
  cancelled: "Cancelled",
  disqualified: "Disqualified",
} as const;

type SearchParams = Record<string, string | string[] | undefined>;
export function parseSubmissionParams(params: SearchParams) {
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  return {
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000000) : 1,
    status: typeof params.status === "string" && Object.hasOwn(submissionFilters, params.status)
      ? params.status as keyof typeof submissionFilters : "all",
    q: typeof params.q === "string" ? params.q.trim().slice(0, 254) : "",
  };
}

export function submissionsHref(contestId: string, params: ReturnType<typeof parseSubmissionParams>) {
  const search = new URLSearchParams();
  if (params.page > 1) search.set("page", String(params.page));
  if (params.status !== "all") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  return `/teacher/contests/${contestId}/submissions${search.size ? `?${search}` : ""}`;
}

export function submissionStatus(
  attempt: { status: string; expiresAt: Date } | null,
  now: Date,
) {
  if (!attempt) return "Not started";
  if (attempt.status === "IN_PROGRESS") return attempt.expiresAt <= now ? "Time expired" : "In progress";
  if (attempt.status === "AUTO_SUBMITTED") return "Auto-submitted";
  if (attempt.status === "EVALUATED") return "Evaluated";
  return "Submitted";
}

export function submissionWhere(
  contestId: string, teacherId: string,
  status: keyof typeof submissionFilters, now: Date,
): Prisma.ContestRegistrationWhereInput {
  const base: Prisma.ContestRegistrationWhereInput = { contestId, contest: { userId: teacherId } };
  switch (status) {
    case "not_started": return { ...base, status: "REGISTERED", attempt: { is: null } };
    case "in_progress": return { ...base, status: "REGISTERED", attempt: { is: { status: "IN_PROGRESS", expiresAt: { gt: now } } } };
    case "expired": return { ...base, status: "REGISTERED", attempt: { is: { status: "IN_PROGRESS", expiresAt: { lte: now } } } };
    case "submitted": return { ...base, attempt: { is: { status: { not: "IN_PROGRESS" } } } };
    case "needs_grading": return { ...base, attempt: { is: { status: { not: "IN_PROGRESS" }, answers: { some: { marksAwarded: null } } } } };
    case "evaluated": return { ...base, attempt: { is: { status: "EVALUATED" } } };
    case "cancelled": return { ...base, status: "CANCELLED" };
    case "disqualified": return { ...base, status: "DISQUALIFIED" };
    default: return base;
  }
}

export async function loadContestSubmissions(
  database: Pick<PrismaClient, "contest" | "contestRegistration">,
  teacherId: string, contestId: string, search: SearchParams,
  findEmailUserIds: (email: string) => Promise<string[]>,
  now = new Date(),
) {
  const contest = await database.contest.findFirst({ where: { id: contestId, userId: teacherId }, select: { id: true } });
  if (!contest) return null;
  const params = parseSubmissionParams(search);
  const where = submissionWhere(contestId, teacherId, params.status, now);
  if (params.q) {
    where.userId = params.q.includes("@")
      ? { in: await findEmailUserIds(params.q) }
      : { contains: params.q, mode: "insensitive" };
  }
  const total = await database.contestRegistration.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / SUBMISSIONS_PAGE_SIZE));
  params.page = Math.min(params.page, pageCount);
  const registrations = await database.contestRegistration.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (params.page - 1) * SUBMISSIONS_PAGE_SIZE,
    take: SUBMISSIONS_PAGE_SIZE,
    select: {
      id: true, userId: true, status: true, createdAt: true,
      attempt: { select: {
        status: true, expiresAt: true, submittedAt: true, score: true, totalMarks: true,
        answers: { where: { marksAwarded: null }, select: { id: true }, take: 1 },
      } },
    },
  });
  return { registrations, total, pageCount, params };
}

export async function loadContestSubmission(
  database: Pick<PrismaClient, "contestRegistration">,
  teacherId: string, contestId: string, registrationId: string,
) {
  return database.contestRegistration.findFirst({
    where: { id: registrationId, contestId, contest: { userId: teacherId } },
    include: {
      attempt: { include: { answers: true } },
      contest: { select: { questions: {
        orderBy: { position: "asc" },
        include: { question: { include: { options: { orderBy: { position: "asc" } } } } },
      } } },
    },
  });
}
