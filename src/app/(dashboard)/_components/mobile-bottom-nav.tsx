"use client";

import Link from "next/link";
import { Compass, GraduationCap, Trophy, UserRound } from "lucide-react";
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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-brand-navy px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.25)] md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = route.active(pathname);

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "relative flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-slate-500 transition",
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
