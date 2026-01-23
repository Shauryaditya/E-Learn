"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    onDateClick?: (date: Date, goals: Goal[]) => void;
}

export const GoalsCalendar = ({ goals, onDateClick }: GoalsCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    console.log("Goals:>>>", goals);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const previousMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        );
    };

    const nextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        );
    };

    const getGoalsForDate = (day: number) => {
        const dateToCheck = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        );
        const dateString = dateToCheck.toDateString();

        return goals.filter((goal) => {
            const goalDate = new Date(goal.dueDate);
            return goalDate.toDateString() === dateString;
        });
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthYear = currentDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
    });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 dark:border-gray-700" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayGoals = getGoalsForDate(day);
        const hasGoals = dayGoals.length > 0;
        const allCompleted = dayGoals.every((g) => g.isCompleted);

        days.push(
            <div
                key={day}
                className={`h-24 border border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition ${hasGoals ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                onClick={() => {
                    if (hasGoals && onDateClick) {
                        const date = new Date(
                            currentDate.getFullYear(),
                            currentDate.getMonth(),
                            day
                        );
                        onDateClick(date, dayGoals);
                    }
                }}
            >
                <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                    {day}
                </div>
                {hasGoals && (
                    <div className="mt-1 space-y-1">
                        {dayGoals.slice(0, 2).map((goal) => (
                            <div
                                key={goal.id}
                                className={`text-xs p-1 rounded truncate ${goal.isCompleted
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                    }`}
                            >
                                {goal.title}
                            </div>
                        ))}
                        {dayGoals.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{dayGoals.length - 2} more
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {monthYear}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={previousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                        key={day}
                        className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0">{days}</div>
        </div>
    );
};
