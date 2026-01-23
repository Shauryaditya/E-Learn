import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GoalsCalendar } from "./_components/goals-calendar";
import { GoalsList } from "./_components/goals-list";

const StudentGoalsPage = async () => {
    const { userId } = auth();

    if (!userId) {
        return redirect("/");
    }

    // Fetch all goals for the logged-in student
    const goals = await db.goal.findMany({
        where: {
            studentId: userId,
        },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                },
            },
            testSeries: {
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                },
            },
        },
        orderBy: {
            dueDate: "asc",
        },
    });

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    My Goals
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track your learning goals set by your teachers
                </p>
            </div>

            {/* Calendar View */}
            <GoalsCalendar goals={goals} />

            {/* List View */}
            <GoalsList initialGoals={goals} />
        </div>
    );
};

export default StudentGoalsPage;
