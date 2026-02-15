import { PushNotificationManager } from "@/components/pwa/push-notification-manager";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { getStudentProfile } from "@/actions/get-student-profile";
import { getStudentPerformance } from "@/actions/get-student-performance";
import { UserButton } from "@clerk/nextjs";
import { CheckCircle, Clock } from "lucide-react";
import { InfoCard } from "../(root)/_components/info-card";
import { CoursesList } from "@/components/courses-list";
import { GoalsCalendar } from "./_components/goals-calendar";
import { GoalsList } from "./_components/goals-list";
import { StudentOnboardingModal } from "@/components/modals/student-onboarding-modal";
import { RecommendationsSection } from "./_components/recommendations-section";
import { PerformanceChart } from "./_components/performance-chart";

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


    // ... items fetch ...

    const { completedCourses, coursesInProgress } = await getDashboardCourses(userId);
    const studentProfile = await getStudentProfile();
    const performanceData = await getStudentPerformance(userId);

    console.log("Student Dashboard - userId:", userId);
    console.log("Student Dashboard - goals count:", goals.length);

    // Filter courses based on profile if available (client-side or here? Here is better if we had specific grade/subject fields in Course, but we don't really. We rely on Category. For now, we show all but label them.)
    
    return (
        <div className="p-6 space-y-8">
            <StudentOnboardingModal isOpen={!studentProfile} />
            
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {studentProfile?.name ? `Welcome back, ${studentProfile.name}` : "Welcome to Your Dashboard"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {studentProfile ? `${studentProfile.grade} | ${studentProfile.board} | ${studentProfile.subjects.join(", ")}` : "Track your learning goals and progress"}
                </p>
                 <div className="mt-4">
                   <PushNotificationManager />
                 </div>
            </div>

            {/* AI Recommendations Section */}
            {studentProfile && (
                <div className="mb-8">
                     <RecommendationsSection profile={studentProfile} />
                </div>
            )}
            
            {/* Performance Chart */}
            {performanceData.length > 0 && (
                <div className="mb-8">
                    <PerformanceChart data={performanceData} />
                </div>
            )}

            {/* Goals Section */}
            <div>
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        My Routine & Goals
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Goals set by your teachers and your personal routine
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
                 <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        My Courses
                    </h2>
                </div>
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
