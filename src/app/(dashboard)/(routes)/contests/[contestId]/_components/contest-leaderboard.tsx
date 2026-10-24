import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LeaderboardEntry = {
  userId: string;
  name: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: Date | null;
};

export function ContestLeaderboard({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId: string }) {
  let previousScore: number | null = null;
  let previousRank = 0;

  return (
    <section className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-4 sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Trophy className="h-5 w-5 text-amber-600" />Leaderboard</h2>
          <p className="mt-1 text-sm text-muted-foreground">Final rankings from fully graded attempts.</p>
        </div>
        <Badge variant="outline">{entries.length} ranked</Badge>
      </div>

      {entries.length ? (
        <ol className="divide-y">
          {entries.map((entry, index) => {
            const rank = previousScore === entry.score ? previousRank : index + 1;
            previousScore = entry.score;
            previousRank = rank;
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <li key={entry.userId} className={cn("grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_8rem_8rem] sm:px-6", isCurrentUser && "bg-blue-50/70 dark:bg-blue-950/20")}>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold tabular-nums", rank <= 3 ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" : "bg-muted text-muted-foreground")}>
                  #{rank}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{entry.name}</span>
                    {isCurrentUser && <Badge variant="outline" className="shrink-0 text-[10px]">You</Badge>}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">{entry.percentage.toFixed(1)}%</span>
                </span>
                <span className="text-right text-sm font-semibold tabular-nums">{entry.score} / {entry.totalMarks}</span>
                <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">{entry.percentage.toFixed(1)}%</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">No fully graded attempts are available yet.</p>
      )}
    </section>
  );
}
