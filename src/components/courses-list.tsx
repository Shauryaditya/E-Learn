import { Category, Course } from "@prisma/client";
import { CourseCard } from "@/components/course-card";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

interface CourseListProps {
  items: CourseWithProgressWithCategory[];
}

export const CoursesList = ({ items }: CourseListProps) => {
  return (
    <section data-tour="courses" className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        Browse Courses
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => (
            <CourseCard
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl!}
            chaptersLength={item.chapters.length}
            price={item.price!}
            progress={item.progress}
            category={item?.category?.name || "Uncategorized"}
            />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
            No courses found
        </div>
      )}
    </section>
  );
};
