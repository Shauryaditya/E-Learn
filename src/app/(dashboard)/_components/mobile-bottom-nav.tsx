"use client";

import Link from "next/link";
import { BookOpen, Compass, GraduationCap, LayoutDashboard, Notebook, Trophy, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const routes = [
  {
    icon: Compass,
    label: "Explore",
    href: "/search",
    active: (pathname: string) => pathname === "/search",
  },
  {
    icon: GraduationCap,
    label: "Learning",
    href: "/dashboard",
    active: (pathname: string) => pathname === "/dashboard",
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
  ] : routes;

  return (
    <nav aria-label={teacher ? "Teacher navigation" : "Student navigation"} data-tour="mobile-nav" className="fixed inset-x-0 bottom-0 z-50 border-t bg-background px-3 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
      <div className="grid grid-cols-4 gap-1">
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
      </div>
    </nav>
  );
};
