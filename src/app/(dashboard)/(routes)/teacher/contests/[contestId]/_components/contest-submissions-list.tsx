import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatContestDateTime } from "@/lib/contest-time";
import {
  SUBMISSIONS_PAGE_SIZE, submissionFilters, submissionStatus, submissionsHref,
  type loadContestSubmissions,
} from "@/lib/contest-submissions";
import { ContestRefreshButton } from "./contest-refresh-button";

type PageData = NonNullable<Awaited<ReturnType<typeof loadContestSubmissions>>>;
type Student = { name: string; email: string };
export function ContestSubmissionsList({ contestId, data, students, now, identityUnavailable = false }: {
  contestId: string; data: PageData; students: Record<string, Student>; now: Date; identityUnavailable?: boolean;
}) {
  const { registrations, total, pageCount, params } = data;
  const base = `/teacher/contests/${contestId}/submissions`;
  const returnQuery = submissionsHref(contestId, params).split("?")[1];
  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Submissions</h2>
        <ContestRefreshButton />
      </div>
      <form key={`${params.q}:${params.status}`} action={base} method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-60 space-y-1.5">
          <label htmlFor="student-search" className="block text-sm font-medium">Student email or ID</label>
          <Input id="student-search" name="q" type="search" defaultValue={params.q} maxLength={254} placeholder="Exact email or student ID" />
        </div>
        <div className="min-w-0 flex-1 basis-48 space-y-1.5 sm:flex-none">
          <label htmlFor="submission-status" className="block text-sm font-medium">Status</label>
          <select id="submission-status" name="status" defaultValue={params.status}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-48">
            {Object.entries(submissionFilters).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <Button type="submit" size="icon" title="Apply filters" aria-label="Apply filters"><Search className="h-4 w-4" /></Button>
        {(params.q || params.status !== "all") && <Button asChild variant="ghost"><Link href={base}>Reset filters</Link></Button>}
      </form>
      {identityUnavailable && <p role="status" className="text-sm text-muted-foreground">Student names are temporarily unavailable. Student IDs are shown below.</p>}
      <div className="min-w-0 overflow-x-auto border-y">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="min-w-52">Student</TableHead>
            <TableHead className="min-w-36">Status</TableHead>
            <TableHead className="min-w-28">Score</TableHead>
            <TableHead className="min-w-44">Submitted</TableHead>
            <TableHead className="text-right">Review</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {registrations.map(registration => {
              const student = students[registration.userId] || { name: "Student", email: registration.userId };
              const attempt = registration.attempt;
              const completed = attempt && attempt.status !== "IN_PROGRESS";
              const href = `${base}/${registration.id}${returnQuery ? `?${returnQuery}` : ""}`;
              return <TableRow key={registration.id}>
                <TableCell>
                  <Link href={href} className="block max-w-80 break-words font-medium hover:underline">{student.name}</Link>
                  <p className="max-w-80 break-all text-xs text-muted-foreground">{student.email}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant="outline" className="whitespace-nowrap">{submissionStatus(attempt, now)}</Badge>
                    {registration.status !== "REGISTERED" && <span className="text-xs text-muted-foreground">
                      {registration.status === "CANCELLED" ? "Cancelled registration" : "Disqualified"}
                    </span>}
                    {completed && attempt.answers.length > 0 && <span className="text-xs text-muted-foreground">Awaiting grading</span>}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">
                  {completed && attempt.score !== null && attempt.totalMarks !== null ? <>
                    {attempt.score} / {attempt.totalMarks}
                    {attempt.answers.length > 0 && <span className="block text-xs text-muted-foreground">Provisional</span>}
                  </> : "Not scored"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {attempt?.submittedAt ? formatContestDateTime(attempt.submittedAt) : "Not submitted"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={href} title={`Review ${student.name}`} aria-label={`Review ${student.name}`}><ArrowUpRight className="h-4 w-4" /></Link>
                  </Button>
                </TableCell>
              </TableRow>;
            })}
            {!registrations.length && <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
              {params.q || params.status !== "all" ? "No students match these filters." : "No students have registered yet."}
            </TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">{total ? `${(params.page - 1) * SUBMISSIONS_PAGE_SIZE + 1}-${Math.min(params.page * SUBMISSIONS_PAGE_SIZE, total)} of ${total} students` : "0 students"}</p>
        <nav aria-label="Submission pages" className="flex items-center gap-3">
          {params.page > 1 ? <Button asChild variant="outline" size="icon">
            <Link href={submissionsHref(contestId, { ...params, page: params.page - 1 })} aria-label="Previous page" title="Previous page"><ArrowLeft className="h-4 w-4" /></Link>
          </Button> : <Button variant="outline" size="icon" disabled aria-label="Previous page"><ArrowLeft className="h-4 w-4" /></Button>}
          <span className="tabular-nums">Page {params.page} of {pageCount}</span>
          {params.page < pageCount ? <Button asChild variant="outline" size="icon">
            <Link href={submissionsHref(contestId, { ...params, page: params.page + 1 })} aria-label="Next page" title="Next page"><ArrowRight className="h-4 w-4" /></Link>
          </Button> : <Button variant="outline" size="icon" disabled aria-label="Next page"><ArrowRight className="h-4 w-4" /></Button>}
        </nav>
      </div>
    </div>
  );
}
