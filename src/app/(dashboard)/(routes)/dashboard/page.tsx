import { PushNotificationManager } from "@/components/pwa/push-notification-manager";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { UserButton } from "@clerk/nextjs";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "../(root)/_components/info-card";
import { CoursesList } from "@/components/courses-list";
import { GoalsCalendar } from "./_components/goals-calendar";
import { GoalsList } from "./_components/goals-list";

const StudentDashboard = async () => {
    const { userId } = auth();

    if (!userId) {
        return redirect("/");
    }

    let goals: any = [];
    try {
        // Fetch all goals for the logged-in student
        goals = await db.goal.findMany({
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
    } catch (error) {
        console.log("Failed to fetch goals:", error);
    }

    const { completedCourses, coursesInProgress } = await getDashboardCourses(userId);

    console.log("Student Dashboard - userId:", userId);
    console.log("Student Dashboard - goals count:", goals.length);
    console.log("Student Dashboard - goals data:", JSON.stringify(goals, null, 2));

    return (
        <div className="p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome to Your Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track your learning goals and progress
                </p>
                <div className="mt-4">
                  <PushNotificationManager />
                </div>
            </div>

            {/* Goals Section */}
            <div>
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        My Goals
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Goals set by your teachers
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Calendar View - Takes up 4 columns */}
                    <div className="lg:col-span-4">
                        <GoalsCalendar goals={goals} />
                    </div>

                    {/* List View - Takes up 8 columns */}
                    <div className="lg:col-span-8">
                        <GoalsList initialGoals={goals} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <InfoCard
                      icon={Clock}
                      label="In Progress"
                      numberOfItems={coursesInProgress.length}
                   />
                   <InfoCard
                      icon={CheckCircle}
                      label="Completed"
                      numberOfItems={completedCourses.length}
                      variant="success"
                   />
                </div>
                <CoursesList items={[...coursesInProgress, ...completedCourses]} />
            </div>
        </div>
    );
};

export default StudentDashboard;
