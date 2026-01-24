import { auth, clerkClient } from "@clerk/nextjs";
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

    const studentIds = enrolledStudents.map((s) => s.userId);
    let studentsWithDetails: any[] = [];

    if (studentIds.length > 0) {
        try {
            const users = await clerkClient.users.getUserList({
                userId: studentIds,
                limit: 100,
            });

            studentsWithDetails = users.map((user) => ({
                id: user.id,
                name: user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.username || "Unknown",
                email: user.emailAddresses?.[0]?.emailAddress || "No email",
            }));
        } catch (error) {
            console.error("Failed to fetch students from Clerk:", error);
            // Fallback to IDs if Clerk fetch fails
            studentsWithDetails = studentIds.map(id => ({
                id,
                name: `Student`,
                email: id
            }));
        }
    }

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
                enrolledStudents={studentsWithDetails}
                initialGoals={goals}
            />
        </div>
    );
};

export default CourseGoalsPage;
