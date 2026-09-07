"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeft, GraduationCap, LogOut } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "./search-input";
import { isTeacher } from "@/lib/teacher";
import { ModeToggle } from "@/components/mode-toggle";

// import { isTeacher } from "@/lib/teacher";

// import { SearchInput } from "./search-input";

export const NavbarRoutes = () => {
  const { userId } = useAuth();
  const { signOut, openSignIn } = useClerk();
  const router = useRouter();
  console.log("userId", userId);
  const pathname = usePathname();

  const isTeacherPage = pathname?.startsWith("/teacher");
  const isCoursePage = pathname?.includes("/courses");

  const isSearchPage = pathname === "/search";

  const handleSignOut = async () => {
    await signOut(() => router.push("/"));
  };

  return (
    <>
      {isSearchPage && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}
      <div className="flex gap-x-2 ml-auto items-center">
        <ModeToggle />
        {isTeacherPage || isCoursePage ? (
          <Button asChild variant="outline">
            <Link href="/dashboard" aria-label={isTeacherPage ? "Student view" : "Back to learning"} title={isTeacherPage ? "Student view" : "Back to learning"}>
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isTeacherPage ? "Student view" : "Back to learning"}</span>
            </Link>
          </Button>
        ) : isTeacher(userId) ? (
          <Button asChild variant="outline">
            <Link href="/teacher/dashboard" aria-label="Teacher workspace" title="Teacher workspace"><GraduationCap className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Teacher workspace</span></Link>
          </Button>
        ) : null}
        {userId ? (
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Button onClick={() => openSignIn()} variant="ghost" size="sm">
            Sign In
          </Button>
        )}
      </div>
    </>
  );
};
