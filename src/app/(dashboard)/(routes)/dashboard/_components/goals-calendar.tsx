"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

interface Goal {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date;
    isCompleted: boolean;
    course: {
        id: string;
        title: string;
        imageUrl: string | null;
    } | null;
    testSeries: {
        id: string;
        title: string;
        imageUrl: string | null;
    } | null;
}

interface GoalsCalendarProps {
    goals: Goal[];
    onDateClick?: (date: Date | undefined, goals: Goal[]) => void;
}

export const GoalsCalendar = ({ goals, onDateClick }: GoalsCalendarProps) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const handleSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);

        if (selectedDate && onDateClick) {
            const dateString = selectedDate.toDateString();
            const dayGoals = goals.filter((goal) => {
                const goalDate = new Date(goal.dueDate);
                return goalDate.toDateString() === dateString;
            });
            onDateClick(selectedDate, dayGoals);
        }
    };

    // Highlight days with goals
    const daysWithGoals = goals.map(goal => new Date(goal.dueDate));

    // Style for days with goals
    const modifiers = {
        hasGoal: daysWithGoals
    };

    const modifiersStyles = {
        hasGoal: {
            fontWeight: 'bold',
            textDecoration: 'underline',
            color: 'var(--primary)'
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Calendar
            </h2>
            <div className="flex-1 flex justify-center items-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleSelect}
                    className="rounded-md border shadow-sm"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                />
            </div>
        </div>
    );
};
