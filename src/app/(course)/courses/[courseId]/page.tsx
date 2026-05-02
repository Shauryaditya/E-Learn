import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs";
import { BookOpen, CheckCircle2, Lock, PlayCircle, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { AuthPromptButton } from "@/components/auth-prompt-button";
import { Preview } from "@/components/preview";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CourseEnrollButton } from "./chapters/[chapterId]/_components/course-enroll-button";

const CourseIdPage = async ({
  params,
}: {
  params: { courseId: string };
}) => {
  const { userId } = auth();

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!course) {
    return redirect("/");
  }

  const purchase = userId
    ? await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      })
    : null;

  const isEnrolled = !!purchase;
  const firstChapter = course.chapters[0];
  const firstFreeChapter = course.chapters.find((chapter) => chapter.isFree);
  const startChapter = isEnrolled ? firstChapter : firstFreeChapter;
  const startHref = startChapter
    ? `/courses/${course.id}/chapters/${startChapter.id}`
    : `/courses/${course.id}`;

  return (
    <div className="min-h-full bg-brand-navy text-brand-tertiary">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/20">
          <div className="relative min-h-[360px]">
            {course.imageUrl ? (
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.35),transparent_35%),linear-gradient(135deg,#0F172A,#111827)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/75 to-brand-navy/20" />
            <div className="relative z-10 flex min-h-[360px] flex-col justify-end gap-5 p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-brand-secondary/15 px-4 py-2 text-sm font-semibold text-brand-secondary ring-1 ring-brand-secondary/30">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Course Preview
                </div>
                <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {course.chapters.length}{" "}
                  {course.chapters.length === 1 ? "Chapter" : "Chapters"}
                </div>
              </div>

              <div className="max-w-3xl">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  {course.title}
                </h1>
                {course.description && (
                  <div className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base [&_.ql-container]:font-sans [&_.ql-editor]:p-0">
                    <Preview value={course.description} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/10 sm:p-6">
            {isEnrolled ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-bold text-emerald-300">
                    You are enrolled in this course
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Continue from the curriculum or jump into the first chapter.
                  </p>
                </div>
                {firstChapter && (
                  <Button asChild size="lg" className="w-full bg-brand-primary">
                    <Link href={`/courses/${course.id}/chapters/${firstChapter.id}`}>
                      Start Learning
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-secondary">
                    Unlock the course
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Start learning with a focused curriculum.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Preview free chapters when available, then enroll to unlock
                    the full course experience.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-brand-navy p-4">
                  <p className="text-sm text-slate-400">Course access</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {course.price !== null ? formatPrice(course.price) : "Free"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    One-time payment. Lifetime access.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {!userId ? (
                    <AuthPromptButton
                      label="Start Learning"
                      redirectUrl={startHref}
                      size="lg"
                      className="w-full bg-brand-primary"
                    />
                  ) : startChapter ? (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <Link href={startHref}>
                        {firstFreeChapter ? "Start Free Preview" : "View Course"}
                      </Link>
                    </Button>
                  ) : null}

                  {course.price !== null && (
                    <CourseEnrollButton courseId={course.id} price={course.price} />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-xl shadow-black/10">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-white">Course Curriculum</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {course.chapters.length} published{" "}
                  {course.chapters.length === 1 ? "chapter" : "chapters"}
                </p>
              </div>
              <div className="rounded-full bg-brand-secondary/10 px-3 py-1 text-xs font-semibold text-brand-secondary">
                Preview
              </div>
            </div>

            {course.chapters.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">
                This course does not have published chapters yet.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {course.chapters.map((chapter, index) => {
                  const canOpen = isEnrolled || chapter.isFree;
                  const requiresSignIn = !userId;
                  const isLocked = !isEnrolled && !chapter.isFree;
                  const chapterHref = `/courses/${course.id}/chapters/${chapter.id}`;
                  const Icon = isEnrolled
                    ? CheckCircle2
                    : isLocked || requiresSignIn
                      ? Lock
                      : PlayCircle;

                  const content = (
                    <div
                      className={cn(
                        "flex items-center gap-4 p-5 transition",
                        canOpen && userId && "hover:bg-white/5",
                        isLocked && "text-slate-500"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                          isEnrolled
                            ? "bg-emerald-400/15 text-emerald-300"
                            : isLocked || requiresSignIn
                              ? "bg-white/5 text-slate-500"
                              : "bg-brand-primary/15 text-brand-primary"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-100">
                          {index + 1}. {chapter.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {isEnrolled
                            ? "Unlocked"
                            : chapter.isFree
                              ? "Free preview"
                              : "Enroll to unlock"}
                        </p>
                      </div>
                    </div>
                  );

                  if (!requiresSignIn && canOpen) {
                    return (
                      <Link key={chapter.id} href={chapterHref} className="block">
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={chapter.id} aria-disabled="true">
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourseIdPage;
