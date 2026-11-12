"use client"

import { BarChart, CalendarRange, Layout, List, Notebook, FileText, Trophy, User, BookOpenCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarItem } from "./sidebar-item";

const guestRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: Notebook,
    label: "Learning Materials",
    href: "/search",
  },
  {
    icon: CalendarRange,
    label: "My Planner",
    href: "/planner",
    badge: "New",
  },
  {
    icon: BookOpenCheck,
    label: "Practice",
    href: "/practice",
    badge: "New",
  },
  {
    icon: Trophy,
    label: "Contests",
    href: "/contests",
  },
  {
    icon: User,
    label: "My Profile",
    href: "/profile",
  }
];

const teacherRoutes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/teacher/dashboard",
  },
  {
    icon: List,
    label: "Learning Materials",
    href: "/teacher/courses",
  },
  {
    icon: Notebook,
    label: "Test Series",
    href: "/teacher/testseries",
  },
  {
    icon: Trophy,
    label: "Contests",
    href: "/teacher/contests",
  },
  {
    icon: BarChart,
    label: "Analytics",
    href: "/teacher/analytics",
  },
  {
    icon: FileText,
    label: "Resources",
    href: "/teacher/resources",
    badge: "New",
  },
]

export const SidebarRoutes = () => {
  const pathname = usePathname();

  const isTeacherPage = pathname?.includes("/teacher");

  const routes = isTeacherPage ? teacherRoutes : guestRoutes;
  return (
    <div className="flex flex-col w-full">
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
          badge={"badge" in route ? route.badge : undefined}
        />
      ))}
    </div>
  )
}
