import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: CSS import handled by Next.js
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/providers/toaster-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StudyActivityTracker } from "@/components/study-activity-tracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aaccent E-Learn | Learn, Practise and Improve",
  description: "Notes, assignments, test series, contests, previous-year papers, and feedback for Indian school students in Classes 6–12.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aaccent E-Learn",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      afterSignUpUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider />
            <StudyActivityTracker />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
