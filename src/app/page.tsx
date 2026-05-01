import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import HeroSection from "@/components/landingpage/HeroSection";
import GoalsAndEvents from "@/components/landingpage/GoalsAndEvents";
import StudyRoom from "@/components/landingpage/StudyRoom";
import MakeFriends from "@/components/landingpage/MakeFriends";
import AnswerAnalysis from "@/components/landingpage/AnswerAnalysis";
import CTASection from "@/components/landingpage/CTASection";

import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function Home() {
    const { userId } = auth();

    if (userId) {
        return redirect("/search");
    }

    return (
        <div className="min-h-screen">
            <InstallPrompt />
            <HeroSection />
            <GoalsAndEvents />
            <StudyRoom />
            <MakeFriends />
            <AnswerAnalysis />
            <CTASection />
        </div>
    );
}
