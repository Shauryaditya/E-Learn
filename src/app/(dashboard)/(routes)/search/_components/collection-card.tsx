import Link from "next/link";
import { BookOpenCheck, GraduationCap, Landmark, Trophy, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Collection = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: "primary" | "secondary" | "light";
};

const collections: Collection[] = [
  {
    title: "JEE Mains Prep",
    description: "Concepts, practice sets, and revision paths for JEE Main.",
    href: "/search?title=JEE",
    icon: GraduationCap,
    accent: "primary",
  },
  {
    title: "WBJEE Preparation",
    description: "Focused preparation for WBJEE chapters and problem solving.",
    href: "/search?title=WBJEE",
    icon: Landmark,
    accent: "secondary",
  },
  {
    title: "Boards Preparation",
    description: "School board syllabus support, notes, and exam readiness.",
    href: "/search?title=Boards",
    icon: BookOpenCheck,
    accent: "primary",
  },
  {
    title: "Madhyamik Preparation",
    description: "Advanced science practice for aptitude and scholarship exams.",
    href: "/search?title=Madhyamik",
    icon: Trophy,
    accent: "light",
  },
];

const accentClass = {
  primary: {
    border: "before:bg-brand-primary",
    icon: "bg-brand-primary/10 text-brand-primary",
    hover: "hover:border-brand-primary/60",
  },
  secondary: {
    border: "before:bg-brand-secondary",
    icon: "bg-brand-secondary/10 text-brand-secondary",
    hover: "hover:border-brand-secondary/60",
  },
  light: {
    border: "before:bg-brand-tertiary",
    icon: "bg-brand-tertiary/10 text-brand-tertiary",
    hover: "hover:border-brand-tertiary/60",
  },
};

export const CollectionCard = () => {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">
        Curated Collections
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {collections.map((collection) => {
          const Icon = collection.icon;
          const accent = accentClass[collection.accent];

          return (
            <Link
              key={collection.title}
              href={collection.href}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/10 bg-brand-navy p-5 text-brand-tertiary transition before:absolute before:inset-y-0 before:left-0 before:w-1 hover:-translate-y-0.5 hover:shadow-lg",
                accent.border,
                accent.hover
              )}
            >
              <div
                className={cn(
                  "mb-10 flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105",
                  accent.icon
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold leading-tight">
                {collection.title}
              </h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-snug text-slate-500">
                {collection.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
