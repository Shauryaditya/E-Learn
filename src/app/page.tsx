import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs";
import type { Metadata } from "next";
import LandingPage from "@/components/landingpage/LandingPage";

import { InstallPrompt } from "@/components/pwa/install-prompt";

export const metadata: Metadata = {
    title: "CBSE, ICSE, ISC & Madhyamik Practice for Classes 8–12 | Aaccent E-Learn",
    description: "Chapter-wise questions, previous school papers, learning materials, test series and teacher feedback for Indian students in Classes 8–12.",
    alternates: { canonical: "/" },
};

export default async function Home() {
    const { userId } = auth();

    if (userId) {
        return redirect("/search");
    }

    return (
        <div className="min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        name: "Aaccent E-Learn",
                        url: "https://elearn.aaccent.in",
                        logo: "https://elearn.aaccent.in/icon.png",
                    }).replace(/</g, "\\u003c"),
                }}
            />
            <InstallPrompt />
            <LandingPage />
        </div>
    );
}
