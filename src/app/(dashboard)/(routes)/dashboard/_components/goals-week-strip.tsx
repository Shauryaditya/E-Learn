"use client";

import { isSameDay, startOfWeek, addDays, format } from "date-fns";
import { cn } from "@/lib/utils";

interface Goal {
    id: string;
    dueDate: Date;
}

interface GoalsWeekStripProps {
    goals: Goal[];
    onDaySelect: (date: Date) => void;
    selectedDate?: Date; // ← add this
}

export const GoalsWeekStrip = ({ goals, onDaySelect, selectedDate }: GoalsWeekStripProps) => {
    // ← remove useState for selected entirely, parent owns it now

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

    const hasGoal = (day: Date) =>
        goals.some(g => isSameDay(new Date(g.dueDate), day));

    return (
        <div className="grid grid-cols-5 gap-2">
            {days.map((day) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isToday = isSameDay(day, new Date());
                const hasGoals = hasGoal(day);

                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => onDaySelect(day)}
                        className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {format(day, "EEE")}
                        </span>
                        <span className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all",
                            isSelected
                                ? "bg-blue-600 text-white"
                                : isToday
                                    ? "text-blue-500 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300"
                        )}>
                            {format(day, "d")}
                        </span>
                        <span className={cn(
                            "h-1 w-1 rounded-full transition-opacity",
                            hasGoals ? "bg-blue-400 opacity-100" : "opacity-0"
                        )} />
                    </button>
                );
            })}
        </div>
    );
};
