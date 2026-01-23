import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import { Clock } from "lucide-react";
import HeroSection from "@/components/landingpage/HeroSection";
import GoalsAndEvents from "@/components/landingpage/GoalsAndEvents";
import StudyRoom from "@/components/landingpage/StudyRoom";
import MakeFriends from "@/components/landingpage/MakeFriends";
import CTASection from "@/components/landingpage/CTASection";

import { Sidebar } from "@/app/(dashboard)/_components/sidebar";
import { Navbar } from "@/app/(dashboard)/_components/navbar";
import { InfoCard } from "@/app/(dashboard)/(routes)/(root)/_components/info-card";

export default async function Home() {
    const { userId } = auth();
    console.log("User ID:", userId);
    // If user is authenticated, show dashboard with layout
    // If user is authenticated, show dashboard with layout
    if (userId) {
        return redirect("/dashboard");
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