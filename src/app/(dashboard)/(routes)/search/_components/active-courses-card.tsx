import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

interface ActiveCoursesCardProps {
  courseId: string;
  title: string;
  imageUrl: string | null;
  progress: number;
  chapterId?: string;
  chaptersLength: number;
}

export const ActiveCoursesCard = ({
  courseId,
  title,
  imageUrl,
  progress,
  chapterId,
  chaptersLength,
}: ActiveCoursesCardProps) => {
  const href = chapterId
    ? `/courses/${courseId}/chapters/${chapterId}`
    : `/courses/${courseId}`;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
        Active Progress
      </h2>
      <Link
        href={href}
        className="group block max-w-md overflow-hidden rounded-2xl border border-white/10 bg-brand-navy text-brand-tertiary shadow-sm transition hover:border-brand-secondary"
      >
        <div
          className="h-1 bg-brand-secondary"
          style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
        />
        <div className="flex items-center gap-4 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-900">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-800" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
              Resume Lesson
            </p>
            <h3 className="line-clamp-1 text-base font-bold text-brand-tertiary">
              {title}
            </h3>
            <p className="line-clamp-2 text-xs text-slate-400">
              {Math.round(progress)}% complete · {chaptersLength}{" "}
              {chaptersLength === 1 ? "chapter" : "chapters"}
            </p>
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-tertiary transition",
              "group-hover:scale-105 group-hover:bg-brand-secondary"
            )}
          >
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </div>
        </div>
      </Link>
    </section>
  );
};
