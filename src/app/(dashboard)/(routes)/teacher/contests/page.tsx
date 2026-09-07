import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Pencil, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatContestDateTime } from "@/lib/contest-time";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const TeacherContestsPage = async () => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const contests = await db.contest.findMany({
    where: { userId },
    include: {
      category: true,
      _count: { select: { questions: true, registrations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contests</h1>
        </div>
        <Button asChild>
          <Link href="/teacher/create-contest">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Contest
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contests.map((contest) => (
              <TableRow key={contest.id}>
                <TableCell>
                  <div className="font-medium">{contest.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {contest.category?.name || "Uncategorized"}
                  </div>
                </TableCell>
                <TableCell>
                  {formatContestDateTime(contest.startsAt)}
                </TableCell>
                <TableCell>{contest.durationMinutes} min</TableCell>
                <TableCell>
                  {contest.price ? formatPrice(contest.price) : "Free"}
                </TableCell>
                <TableCell>{contest._count.questions}</TableCell>
                <TableCell>{contest._count.registrations}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "bg-slate-500",
                      contest.isPublished && "bg-sky-700"
                    )}
                  >
                    {contest.isPublished ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/teacher/contests/${contest.id}`} title="Edit contest" aria-label={`Edit ${contest.title}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/teacher/contests/${contest.id}/submissions`}><ClipboardList className="mr-2 h-4 w-4" />Submissions</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {contests.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No contests created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TeacherContestsPage;
