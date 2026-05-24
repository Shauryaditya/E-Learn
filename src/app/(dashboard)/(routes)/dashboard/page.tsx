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
import { StudentOnboardingModal } from "@/components/modals/student-onboarding-modal";
import { RecommendationsSection } from "./_components/recommendations-section";
import { PerformanceChart } from "./_components/performance-chart";
import { GoalsSection } from "./_components/goal-section";
import { TextFlippingBoardDemo } from "./_components/text-flipping";

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
    const studentProfile = await getStudentProfile();
    const performanceData = await getStudentPerformance(userId);

    console.log("Student Dashboard - userId:", userId);
    console.log("Student Dashboard - goals count:", goals.length);

    // Filter courses based on profile if available (client-side or here? Here is better if we had specific grade/subject fields in Course, but we don't really. We rely on Category. For now, we show all but label them.)
    
    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
            <StudentOnboardingModal isOpen={!studentProfile} />
            
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white md:text-3xl">
                            {studentProfile?.name ? `Welcome back, ${studentProfile.name}` : "Welcome to Your Dashboard"}
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 md:text-base">
                            {studentProfile ? `${studentProfile.grade} | ${studentProfile.board} | ${studentProfile.subjects.join(", ")}` : "Track your learning goals and progress"}
                        </p>
                    </div>
                    {/* <div className="mt-4">
                      <PushNotificationManager />
                    </div> */}
                </div>
            </div>

            {/* AI Recommendations Section */}
            {studentProfile && (
                <div>
                     <RecommendationsSection profile={studentProfile} />
                </div>
            )}
            
            {/* Performance Chart */}
            {performanceData.length > 0 && (
                <div>
                    <PerformanceChart data={performanceData} />
                </div>
            )}

            {/* Goals Section */}
            <div>
                <div className="mb-4">
                    <h2 className="mb-1 text-xl font-semibold text-slate-950 dark:text-white md:text-2xl">
                        My Routine & Goals
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Goals set by your teachers and your personal routine
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                    <GoalsSection goals={goals} />
                </div>
            </div>
            <div>
                <TextFlippingBoardDemo />
            </div>  

            <div className="space-y-4">
                 <div className="mb-4">
                    <h2 className="mb-1 text-xl font-semibold text-slate-950 dark:text-white md:text-2xl">
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
