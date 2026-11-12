"use client";

import Link from "next/link";
import { BookOpen, BookOpenCheck, CalendarRange, LayoutDashboard, MoreHorizontal, Notebook, Trophy, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const routes = [
  {
    icon: LayoutDashboard,
    label: "Home",
    href: "/dashboard",
    active: (pathname: string) => pathname === "/dashboard",
  },
  {
    icon: BookOpen,
    label: "Learn",
    href: "/search",
    active: (pathname: string) => pathname.startsWith("/search") || pathname.startsWith("/courses/"),
  },
  {
    icon: CalendarRange,
    label: "Planner",
    href: "/planner",
    active: (pathname: string) => pathname.startsWith("/planner"),
  },
  {
    icon: BookOpenCheck,
    label: "Practice",
    href: "/practice",
    active: (pathname: string) => pathname.startsWith("/practice"),
  },
  {
    icon: Trophy,
    label: "Contests",
    href: "/contests",
    active: (pathname: string) => pathname.startsWith("/contests"),
  },
  {
    icon: UserRound,
    label: "Profile",
    href: "/profile",
    active: (pathname: string) => pathname === "/profile",
  },
];

export const MobileBottomNav = () => {
  const pathname = usePathname() || "";
  const teacher = pathname.startsWith("/teacher/");
  const visibleRoutes = teacher ? [
    { icon: LayoutDashboard, label: "Dashboard", href: "/teacher/dashboard", active: (path: string) => path === "/teacher/dashboard" },
    { icon: BookOpen, label: "Courses", href: "/teacher/courses", active: (path: string) => path.startsWith("/teacher/courses") || path === "/teacher/create" },
    { icon: Notebook, label: "Tests", href: "/teacher/testseries", active: (path: string) => path.startsWith("/teacher/testseries") || path === "/teacher/create-testseries" },
    { icon: Trophy, label: "Contests", href: "/teacher/contests", active: (path: string) => path.startsWith("/teacher/contests") || path === "/teacher/create-contest" },
  ] : routes.slice(0, 4);
  const isMoreActive = pathname.startsWith("/contests") || pathname === "/profile";

  return (
    <nav aria-label={teacher ? "Teacher navigation" : "Student navigation"} data-tour="mobile-nav" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-3 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
      <div className={cn("grid gap-1", teacher ? "grid-cols-4" : "grid-cols-5")}>
        {visibleRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = route.active(pathname);

          return (
            <Link
              key={route.href}
              href={route.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold text-muted-foreground transition",
                isActive && "bg-brand-primary/10 text-brand-primary"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition",
                  isActive && "bg-brand-primary text-brand-tertiary"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{route.label}</span>
              {isActive && (
                <span className="absolute -bottom-2 h-1 w-full rounded-t-full bg-brand-primary" />
              )}
            </Link>
          );
        })}
        {!teacher && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="More navigation" aria-current={isMoreActive ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-semibold text-muted-foreground transition", isMoreActive && "bg-brand-primary/10 text-brand-primary")}>
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-full transition", isMoreActive && "bg-brand-primary text-brand-tertiary")}><MoreHorizontal className="h-4 w-4" /></span>
                <span>More</span>
                {isMoreActive && <span className="absolute -bottom-2 h-1 w-full rounded-t-full bg-brand-primary" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="mb-2 w-48">
              <DropdownMenuItem asChild><Link href="/contests" className="flex cursor-pointer items-center gap-2"><Trophy className="h-4 w-4" />Contests</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/profile" className="flex cursor-pointer items-center gap-2"><UserRound className="h-4 w-4" />My Profile</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};
