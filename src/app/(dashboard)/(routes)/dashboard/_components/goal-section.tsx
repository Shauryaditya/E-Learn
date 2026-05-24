"use client";

import { useState } from "react";
import { GoalsWeekStrip } from "./goals-week-strip";
import { GoalsList } from "./goals-list";

export const GoalsSection = ({ goals }: { goals: any[] }) => {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    const handleDaySelect = (date: Date) => {
        // Toggle — clicking the same day again shows all goals
        setSelectedDate(prev =>
            prev?.toDateString() === date.toDateString() ? undefined : date
        );
    };

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] xl:col-span-7 2xl:col-span-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Routine & Goals
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    {(selectedDate ?? new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
            </div>

            <div className="mt-5">
                <GoalsWeekStrip goals={goals} onDaySelect={handleDaySelect} selectedDate={selectedDate} />
            </div>

            <div className="my-5 border-t border-slate-100 dark:border-white/10" />

            <GoalsList initialGoals={goals} selectedDate={selectedDate} />
        </div>
    );
};
