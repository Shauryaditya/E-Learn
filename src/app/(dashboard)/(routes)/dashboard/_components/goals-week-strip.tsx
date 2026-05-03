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
        <div className="flex items-center justify-between px-1">
            {days.map((day) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isToday = isSameDay(day, new Date());
                const hasGoals = hasGoal(day);

                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => onDaySelect(day)}
                        className="flex flex-col items-center gap-1.5 w-12"
                    >
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {format(day, "EEE")}
                        </span>
                        <span className={cn(
                            "w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all",
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