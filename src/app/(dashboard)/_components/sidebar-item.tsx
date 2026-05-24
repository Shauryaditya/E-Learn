"use client";

import { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
};

export const SidebarItem = ({
  icon: Icon,
  label,
  href,
}: SidebarItemProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive =
    (pathname === "/" && href === "/") ||
    pathname === href ||
    pathname?.startsWith(`${href}/`);

  const onClick = () => {
    router.push(href);
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "group relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
        isActive && "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
      )}
    >
      <div className="flex min-w-0 items-center gap-x-3">
        <Icon
          size={20}
          className={cn(
            "shrink-0 text-slate-400 transition-colors group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-white",
            isActive && "text-blue-600 group-hover:text-blue-600 dark:text-blue-300 dark:group-hover:text-blue-200"
          )}
        />
        <span className="truncate">{label}</span>
      </div>
      {isActive && (
        <span className="absolute inset-y-2 right-2 w-1 rounded-full bg-blue-600 dark:bg-blue-300" />
      )}
    </button>
  )
}
