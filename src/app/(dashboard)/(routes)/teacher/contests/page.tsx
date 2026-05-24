import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

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
      questions: {
        select: { id: true },
      },
      registrations: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contests</h1>
          <p className="text-sm text-muted-foreground">
            Schedule weekly contests and manage their question sets.
          </p>
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
                  {contest.startsAt.toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell>{contest.durationMinutes} min</TableCell>
                <TableCell>
                  {contest.price ? formatPrice(contest.price) : "Free"}
                </TableCell>
                <TableCell>{contest.questions.length}</TableCell>
                <TableCell>{contest.registrations.length}</TableCell>
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
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/teacher/contests/${contest.id}`}>Edit</Link>
                  </Button>
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
