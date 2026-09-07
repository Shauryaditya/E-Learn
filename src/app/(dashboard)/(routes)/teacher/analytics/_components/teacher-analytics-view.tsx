import Link from "next/link";
import { ArrowUpRight, BookOpen, ClipboardCheck, Notebook, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { AnalyticsView } from "@/lib/teacher-analytics";
import { cn } from "@/lib/utils";

type Metric = { label: string; value: number; detail: string; format?: "currency" | "percentage" };
type Row = { id: string; name: string; href: string; status: string; primary: number; secondary: number; value: number };
type AnalyticsData = { view: AnalyticsView; metrics: Metric[]; rows: Row[];
  labels: { primary: string; secondary: string; value: string }; percentageColumns?: string[] };

const views = [
  { id: "courses" as const, label: "Courses", singular: "Course", icon: BookOpen },
  { id: "test-series" as const, label: "Test series", singular: "Test series", icon: Notebook },
  { id: "contests" as const, label: "Contests", singular: "Contest", icon: Trophy },
];
function displayValue(value: number, format?: Metric["format"]) {
  if (format === "currency") return formatPrice(value);
  if (format === "percentage") return `${Math.round(value * 10) / 10}%`;
  return new Intl.NumberFormat("en-IN").format(value);
}

export function TeacherAnalyticsView({ data }: { data: AnalyticsData }) {
  const maxPrimary = Math.max(...data.rows.map(row => row.primary), 1);
  const area = views.find(view => view.id === data.view)!;
  return <div className="min-h-screen w-full min-w-0 max-w-full overflow-x-hidden bg-background text-foreground">
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <header><h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance and activity across your teaching workspace.</p></header>
      <nav aria-label="Analytics area" className="flex max-w-full gap-1 overflow-x-auto border-b">
        {views.map(view => <Link key={view.id} href={`/teacher/analytics?view=${view.id}`}
          aria-current={view.id === data.view ? "page" : undefined}
          className={cn("inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium",
            view.id === data.view ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          <view.icon className="h-4 w-4" />{view.label}</Link>)}
      </nav>
      <section aria-labelledby="summary-heading">
        <div className="mb-3 flex items-center gap-2"><area.icon className="h-5 w-5 text-primary" />
          <h2 id="summary-heading" className="text-lg font-semibold">{area.label} overview</h2></div>
        <div className="grid grid-cols-2 border-y lg:grid-cols-4">
          {data.metrics.map((metric, index) => <div key={metric.label}
            className={cn("min-w-0 px-3 py-5 sm:px-5", index % 2 === 0 && "border-r",
              index < 2 && "border-b lg:border-b-0", index === 1 && "lg:border-r")}>
            <p className="min-h-10 text-sm text-muted-foreground sm:min-h-0">{metric.label}</p>
            <p className="mt-2 break-words text-2xl font-semibold tabular-nums sm:text-3xl">{displayValue(metric.value, metric.format)}</p>
            <p className="mt-1 break-words text-xs text-muted-foreground">{metric.detail}</p>
          </div>)}
        </div>
      </section>
      <section className="grid w-full min-w-0 max-w-full gap-8 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 max-w-full">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Performance by {area.label.toLowerCase()}</h2>
            <span className="text-xs text-muted-foreground">{data.rows.length} total</span>
          </div>
          <div className="hidden w-full min-w-0 max-w-full overflow-x-auto border-y sm:block">
            <table className="w-full min-w-[660px] text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground"><tr>
                <th className="px-4 py-3 font-medium">{area.singular}</th>
                <th className="px-4 py-3 text-right font-medium">{data.labels.primary}</th>
                <th className="px-4 py-3 text-right font-medium">{data.labels.secondary}</th>
                <th className="px-4 py-3 text-right font-medium">{data.labels.value}</th>
                <th className="w-12"><span className="sr-only">Open</span></th>
              </tr></thead>
              <tbody className="divide-y">
                {data.rows.map(row => <tr key={row.id} className="group hover:bg-muted/30">
                  <td className="max-w-sm px-4 py-4"><Link href={row.href} className="break-words font-medium hover:underline">{row.name}</Link>
                    <Badge variant="outline" className="ml-2 align-middle font-normal">{row.status}</Badge>
                    <div className="mt-2 h-1.5 max-w-48 overflow-hidden rounded bg-muted"><div className="h-full bg-primary"
                      style={{ width: `${Math.max(row.primary > 0 ? 6 : 0, row.primary / maxPrimary * 100)}%` }} /></div>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{row.primary}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{data.percentageColumns?.includes("secondary") ? `${Math.round(row.secondary * 10) / 10}%` : row.secondary}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{data.view === "courses" ? formatPrice(row.value) : `${Math.round(row.value * 10) / 10}%`}</td>
                  <td className="px-2 py-4"><Link href={row.href} title={`Open ${row.name}`} aria-label={`Open ${row.name}`}>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></Link></td>
                </tr>)}
                {!data.rows.length && <tr><td colSpan={5} className="h-32 px-4 text-center text-muted-foreground">No {area.label.toLowerCase()} data yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="divide-y border-y sm:hidden">
            {data.rows.map(row => <Link key={row.id} href={row.href} className="block py-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium">{row.name}</p>
                  <Badge variant="outline" className="mt-2 font-normal">{row.status}</Badge>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2">
                <div><dt className="text-[11px] text-muted-foreground">{data.labels.primary}</dt><dd className="mt-1 text-sm font-medium tabular-nums">{row.primary}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">{data.labels.secondary}</dt><dd className="mt-1 text-sm font-medium tabular-nums">{data.percentageColumns?.includes("secondary") ? `${Math.round(row.secondary * 10) / 10}%` : row.secondary}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">{data.labels.value}</dt><dd className="mt-1 text-sm font-medium tabular-nums">{data.view === "courses" ? formatPrice(row.value) : `${Math.round(row.value * 10) / 10}%`}</dd></div>
              </dl>
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-primary"
                style={{ width: `${Math.max(row.primary > 0 ? 6 : 0, row.primary / maxPrimary * 100)}%` }} /></div>
            </Link>)}
            {!data.rows.length && <p className="py-12 text-center text-sm text-muted-foreground">No {area.label.toLowerCase()} data yet.</p>}
          </div>
        </div>
        <aside className="min-w-0 border-l-2 border-amber-500 bg-muted/30 p-5">
          <ClipboardCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          <h2 className="mt-4 font-semibold">How these numbers work</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
            {data.view === "courses" && <><p>Enrollments count completed course purchases.</p>
              <p>Sales value uses each course&apos;s current price because historical purchase prices are not stored yet.</p></>}
            {data.view === "test-series" && <><p>Completion and scores come from objective test attempts.</p>
              <p>Descriptive uploads appear in the overview but do not yet contribute to average scores.</p></>}
            {data.view === "contests" && <><p>Participation compares started attempts with active registrations.</p>
              <p>Scores remain provisional while any answer is awaiting manual grading.</p></>}
          </div>
        </aside>
      </section>
    </div>
  </div>;
}
