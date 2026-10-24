"use client";

import { Resource } from "@prisma/client";
import { ArrowUpRight, Building2, CalendarDays, FileText, GraduationCap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resourceCategoryLabel, resourceTypeLabel } from "@/lib/resource-options";

export const StudentResourcesList = ({ items }: { items: Resource[] }) => {
  if (!items.length) {
    return (
      <div className="border-y py-16 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No matching papers</h3>
        <p className="mt-1 text-sm text-muted-foreground">Try clearing one or more filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(item => (
        <article key={item.id} className="flex min-w-0 flex-col rounded-md border bg-card p-4 shadow-sm transition hover:border-foreground/20 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"><FileText className="h-5 w-5" /></div>
            <Badge variant="outline" className="max-w-[65%] truncate">{resourceTypeLabel(item.type)}</Badge>
          </div>

          <div className="mt-4 min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{resourceCategoryLabel(item.category)}</p>
            <h3 className="mt-1 line-clamp-2 break-words text-base font-semibold leading-6" title={item.title}>{item.title}</h3>
            {item.schoolName && <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4 shrink-0" /><span className="truncate">{item.schoolName}</span></p>}
            {item.description && <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description}</p>}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-4 text-xs">
            <div className="min-w-0"><dt className="text-muted-foreground">Subject</dt><dd className="mt-0.5 truncate font-medium">{item.subject}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Class</dt><dd className="mt-0.5 truncate font-medium">{item.grade || "All classes"}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Year</dt><dd className="mt-0.5 flex items-center gap-1 font-medium"><CalendarDays className="h-3.5 w-3.5" />{item.year || "Not specified"}</dd></div>
            <div className="min-w-0"><dt className="text-muted-foreground">Board</dt><dd className="mt-0.5 flex items-center gap-1 truncate font-medium"><GraduationCap className="h-3.5 w-3.5 shrink-0" />{item.board || "General"}</dd></div>
          </dl>

          {item.examType && <p className="mt-3 text-xs text-muted-foreground">Exam: <span className="font-medium text-foreground">{item.examType}</span></p>}
          <Button asChild className="mt-4 w-full">
            <Link href={item.url} target="_blank" rel="noreferrer">Open paper<ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </article>
      ))}
    </div>
  );
};
