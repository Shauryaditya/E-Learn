"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContestWorkspaceNav({ contestId }: { contestId: string }) {
  const pathname = usePathname();
  const base = `/teacher/contests/${contestId}`;
  const submissions = pathname?.startsWith(`${base}/submissions`);
  return (
    <nav aria-label="Contest workspace" className="flex gap-6 border-b">
      {[
        { href: base, label: "Setup", icon: Settings2, active: !submissions },
        { href: `${base}/submissions`, label: "Submissions", icon: ClipboardList, active: submissions },
      ].map(item => (
        <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}
          className={cn("flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium", item.active
            ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <item.icon className="h-4 w-4" />{item.label}
        </Link>
      ))}
    </nav>
  );
}
