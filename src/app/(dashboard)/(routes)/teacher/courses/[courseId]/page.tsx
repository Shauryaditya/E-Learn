import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { CircleDollarSign, File, LayoutDashboard, ListChecks, Target } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { ImageForm } from "./_components/image-form";
import { CategoryForm } from "./_components/category-form";
import { PriceForm } from "./_components/price-form";
import { AttachmentForm } from "./_components/attachment-form";
import { ChaptersForm } from "./_components/chapters-form";
import { Banner } from "@/components/banner";
import { Actions } from "./_components/actions";

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = auth();
  if (!userId) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
      userId
    },
    include: {
      chapters: {
        orderBy: {
          position: "asc",
        }
      },
      attachments: {
        orderBy: {
          createdAt: "desc",
        }
      }
    }
  });

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  console.log("Categories>>", categories);
  if (!course) {
    return redirect("/");
  }

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.categoryId,
    course.price,
    course.chapters.some(chapter => chapter.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields} / ${totalFields})`;

  const isComplete = requiredFields.every(Boolean)
  return (
    <>
      {!course.isPublished && (
        <Banner
          label="This course is unpublished.It will not be visible to the students"
        />
      )}
      <div className="p-6">
        <div className="flex md:flex-row flex-col items-center justify-between gap-x-4">
          <div className="w-full flex flex-col gap-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Course Setup
            </h1>
            <span>Complete All fields {completionText}</span>

            <Actions
              disabled={!isComplete}
              courseId={params.courseId}
              isPublished={course.isPublished}
            />
            <div className=" grid grid-cols-1 md:grid-cols-1 gap-6 mt-16">
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">Customize your course</h2>
              </div>
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
              <ImageForm initialData={course} courseId={course.id} />
              <CategoryForm
                initialData={course}
                courseId={course.id}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category.id,
                }))}
              />
            </div>
          </div>
          <div className="w-full space-y-6">
            <div className="">
              <div className=" flex flex-col items-center gap-x-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">Course Chapters</h2>
                <ChaptersForm initialData={course} courseId={course.id} />
              </div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={CircleDollarSign} />
                <h2 className="text-xl">Sell your course</h2>
              </div>
              <PriceForm initialData={course} courseId={course.id} />

              <div className="flex items-center gap-x-2 mt-6">
                <IconBadge icon={Target} />
                <h2 className="text-xl">Set Goals for Students</h2>
              </div>
              <div className="mt-2 border bg-slate-100 dark:bg-slate-800 rounded-md p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                  Create and manage learning goals for students enrolled in this course.
                </p>
                <Link href={`/teacher/courses/${params.courseId}/goals`}>
                  <button className="px-4 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800 transition">
                    Manage Goals
                  </button>
                </Link>
              </div>

              <div className="flex items-center gap-x-2 mt-6">
                <IconBadge icon={File} />
                <h2 className="text-xl">Attachment</h2>
              </div>
              <AttachmentForm initialData={course} courseId={course.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
