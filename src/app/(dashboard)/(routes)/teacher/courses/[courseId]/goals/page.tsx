import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GoalsManagement } from "./_components/goals-management";

const CourseGoalsPage = async ({
    params,
}: {
    params: { courseId: string };
}) => {
    const { userId } = auth();

    if (!userId) {
        return redirect("/");
    }

    // Verify teacher owns the course
    const course = await db.course.findUnique({
        where: {
            id: params.courseId,
            userId,
        },
    });

    if (!course) {
        return redirect("/");
    }

    // Fetch enrolled students
    const enrolledStudents = await db.purchase.findMany({
        where: {
            courseId: params.courseId,
        },
        select: {
            userId: true,
        },
    });

    // Fetch existing goals
    const goals = await db.goal.findMany({
        where: {
            courseId: params.courseId,
        },
        orderBy: {
            dueDate: "asc",
        },
    });

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Student Goals
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Set and manage goals for students enrolled in {course.title}
                    </p>
                </div>
            </div>

            <GoalsManagement
                courseId={params.courseId}
                enrolledStudents={enrolledStudents.map((s) => s.userId)}
                initialGoals={goals}
            />
        </div>
    );
};

export default CourseGoalsPage;
