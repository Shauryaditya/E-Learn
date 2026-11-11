import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import LandingPage from "@/components/landingpage/LandingPage";

import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function Home() {
    const { userId } = auth();

    if (userId) {
        return redirect("/search");
    }

    return (
        <div className="min-h-screen">
            <InstallPrompt />
            <LandingPage />
        </div>
    );
}
