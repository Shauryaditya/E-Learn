import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ListChecks } from "lucide-react";

import { Banner } from "@/components/banner";
import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { ContestActions } from "./_components/contest-actions";
import { ContestDetailsForm } from "./_components/contest-details-form";
import { ContestQuestionsManager } from "./_components/contest-questions-manager";

const ContestSetupPage = async ({
  params,
}: {
  params: { contestId: string };
}) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/");
  }

  const contest = await db.contest.findUnique({
    where: {
      id: params.contestId,
      userId,
    },
    include: {
      questions: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { position: "asc" },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!contest) {
    return redirect("/teacher/contests");
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  const questionBank = await db.questionBank.findMany({
    where: { userId },
    include: {
      options: {
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const requiredFields = [
    contest.title,
    contest.startsAt,
    contest.durationMinutes,
    contest.questions.length > 0,
  ];

  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!contest.isPublished && (
        <Banner label="This contest is unpublished. Students cannot register yet." />
      )}
      <div className="p-6">
        <Link
          href="/teacher/contests"
          className="mb-6 flex items-center text-sm transition hover:opacity-75"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to contests
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Contest setup</h1>
            <p className="text-sm text-muted-foreground">
              Complete all fields ({completedFields}/{requiredFields.length})
            </p>
          </div>
          <ContestActions
            contestId={contest.id}
            disabled={!isComplete}
            isPublished={contest.isPublished}
          />
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[420px_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-x-2">
              <IconBadge icon={CalendarClock} />
              <h2 className="text-xl font-medium">Schedule & details</h2>
            </div>
            <ContestDetailsForm
              contestId={contest.id}
              initialData={{
                title: contest.title,
                description: contest.description,
                imageUrl: contest.imageUrl,
                price: contest.price,
                startsAt: contest.startsAt,
                durationMinutes: contest.durationMinutes,
                registrationOpensAt: contest.registrationOpensAt,
                registrationClosesAt: contest.registrationClosesAt,
                maxParticipants: contest.maxParticipants,
                categoryId: contest.categoryId,
              }}
              categories={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />
          </div>

          <div>
            <div className="mb-4 flex items-center gap-x-2">
              <IconBadge icon={ListChecks} />
              <h2 className="text-xl font-medium">Questions</h2>
            </div>
            <ContestQuestionsManager
              contestId={contest.id}
              contestQuestions={contest.questions}
              questionBank={questionBank}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ContestSetupPage;
