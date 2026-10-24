"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type FilterOptions = {
  schools: string[];
  boards: string[];
  grades: string[];
  subjects: string[];
  years: number[];
  examTypes: string[];
};

const collections = [
  { value: "SCHOOL", label: "School papers" },
  { value: "BOARD", label: "Board exams" },
  { value: "JEE_MAINS", label: "JEE Main" },
  { value: "JEE_ADVANCED", label: "JEE Advanced" },
  { value: "NEET", label: "NEET" },
  { value: "ALL", label: "All" },
];

export function ResourceFilters({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get("category") || "SCHOOL";
  const [query, setQuery] = useState(searchParams?.get("q") || "");
  const debouncedQuery = useDebounce(query);

  function update(key: string, value?: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (key === "category" && value === "ALL") params.set(key, value);
    else if (!value || value === "ALL") params.delete(key);
    else params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function selectCategory(value: string) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("category", value);
    for (const key of ["school", "board", "grade", "examType"]) params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    update("q", debouncedQuery);
    // update is intentionally derived from the latest URL state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const activeFilterCount = ["school", "board", "grade", "subject", "year", "examType"]
    .filter(key => searchParams?.get(key)).length;

  function clearFilters() {
    setQuery("");
    router.replace(`${pathname}?category=${activeCategory}`, { scroll: false });
  }

  const FilterSelect = ({ name, label, values }: { name: string; label: string; values: (string | number)[] }) => (
    <Select value={searchParams?.get(name) || "ALL"} onValueChange={value => update(name, value)}>
      <SelectTrigger aria-label={label}><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All {label.toLowerCase()}</SelectItem>
        {values.map(value => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex min-w-max rounded-md border bg-background p-1">
          {collections.map(collection => (
            <button
              key={collection.value}
              type="button"
              aria-pressed={activeCategory === collection.value}
              onClick={() => selectCategory(collection.value)}
              className={cn(
                "h-9 rounded px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                activeCategory === collection.value && "bg-foreground text-background shadow-sm hover:text-background"
              )}
            >
              {collection.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium">
        <SlidersHorizontal className="h-4 w-4" />Filters
        {activeFilterCount > 0 && <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">{activeFilterCount}</span>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={event => setQuery(event.target.value)} className="pl-9" placeholder="Search school, subject, or paper" />
        </div>
        <FilterSelect name="grade" label="Classes" values={options.grades} />
        <FilterSelect name="year" label="Years" values={options.years} />
        <FilterSelect name="school" label="Schools" values={options.schools} />
        <FilterSelect name="board" label="Boards" values={options.boards} />
        <FilterSelect name="subject" label="Subjects" values={options.subjects} />
        <FilterSelect name="examType" label="Exams" values={options.examTypes} />
      </div>

      {(activeFilterCount > 0 || query) && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="px-2 text-muted-foreground">
          <X className="mr-1.5 h-4 w-4" />Clear filters
        </Button>
      )}
    </div>
  );
}
