import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { auth } from "@clerk/nextjs";
import { Clock } from "lucide-react";
import HeroSection from "@/components/landingpage/HeroSection";
import GoalsAndEvents from "@/components/landingpage/GoalsAndEvents";
import StudyRoom from "@/components/landingpage/StudyRoom";
import MakeFriends from "@/components/landingpage/MakeFriends";
import CTASection from "@/components/landingpage/CTASection";

import { Sidebar } from "@/app/(dashboard)/_components/sidebar";
import { Navbar } from "@/app/(dashboard)/_components/navbar";
import { InfoCard } from "./(dashboard)/(routes)/(root)/_components/info-card";

export default async function Home() {
  const { userId } = auth();
  console.log("User ID:", userId);
  // If user is authenticated, show dashboard with layout
  if (userId) {
    const { completedCourses, coursesInProgress } = await getDashboardCourses(
      userId
    );

    return (
      <div className="h-full">
        <div className="h-[80px] md:pl-56 fixed w-full inset-y-0 z-50">
          <Navbar />
        </div>
        <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
          <Sidebar />
        </div>
        <main className="md:pl-56 pt-[80px] h-full">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard
                icon={Clock}
                label="In Progress"
                numberOfItems={coursesInProgress.length}
              />
              <InfoCard
                icon={Clock}
                label="Completed"
                numberOfItems={completedCourses.length}
                variant="success"
              />
            </div>
            <CoursesList items={[...coursesInProgress, ...completedCourses]} />
          </div>
        </main>
      </div>
    );
  }

  // If user is not authenticated, show landing page
  return (
    <div className="min-h-screen">
      <HeroSection />
      <GoalsAndEvents />
      <StudyRoom />
      <MakeFriends />
      <CTASection />
    </div>
  );
}
