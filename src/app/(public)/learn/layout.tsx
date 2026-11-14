import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function PublicLearningLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white"><GraduationCap className="h-4 w-4" /></span>
            <span>Aaccent <span className="text-blue-600">E-Learn</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white sm:inline-flex">Sign in</Link>
            <Link href="/sign-up" className="inline-flex h-9 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">Save your progress <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t bg-white dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Aaccent E-Learn. Learning resources for Indian school students.</p>
          <div className="flex gap-4"><Link href="/learn" className="hover:text-slate-950 dark:hover:text-white">Browse learning resources</Link><Link href="/sign-up" className="hover:text-slate-950 dark:hover:text-white">Create account</Link></div>
        </div>
      </footer>
    </div>
  );
}
