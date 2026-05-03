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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Routine & Goals
                </h2>
                <span className="text-sm text-gray-400 dark:text-gray-500">
                    {(selectedDate ?? new Date()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
            </div>

            <GoalsWeekStrip goals={goals} onDaySelect={handleDaySelect} selectedDate={selectedDate} />

            <div className="border-t border-gray-100 dark:border-white/5" />

            <GoalsList initialGoals={goals} selectedDate={selectedDate} />
        </div>
    );
};