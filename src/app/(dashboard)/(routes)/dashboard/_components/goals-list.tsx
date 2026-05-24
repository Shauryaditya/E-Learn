// goals-list.tsx — the minimal goal rows
"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { isSameDay, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

interface Goal {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date;
    isCompleted: boolean;
    studentId: string;
    teacherId: string;
    course: { id: string; title: string; imageUrl: string | null } | null;
    testSeries: { id: string; title: string; imageUrl: string | null } | null;
}

interface GoalsListProps {
    initialGoals: Goal[];
    selectedDate?: Date;
}

export const GoalsList = ({ initialGoals, selectedDate }: GoalsListProps) => {
    const [goals, setGoals] = useState<Goal[]>(initialGoals);
    const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);

    const handleToggleComplete = async (goalId: string, currentStatus: boolean) => {
        try {
            setUpdatingGoal(goalId);
            const response = await axios.patch(`/api/goals/${goalId}`, {
                isCompleted: !currentStatus,
            });
            setGoals(goals.map((g) => (g.id === goalId ? response.data : g)));
            toast.success(!currentStatus ? "Goal completed!" : "Marked as pending");
        } catch {
            toast.error("Failed to update goal");
        } finally {
            setUpdatingGoal(null);
        }
    };

    // If a date is selected from the week strip, filter to that day
    // Otherwise show all, sorted by urgency
    const filtered = selectedDate
        ? goals.filter(g => isSameDay(new Date(g.dueDate), selectedDate))
        : [...goals].sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

    const getProgress = (goal: Goal) => {
        if (goal.isCompleted) return 100;
        return 0; // extend later with real progress from UserProgress
    };

    const getProgressLabel = (goal: Goal) => {
        if (goal.isCompleted) return "DONE";
        const p = getProgress(goal);
        return p > 0 ? `${p}%` : "0%";
    };

    const getProgressColor = (goal: Goal) => {
        if (goal.isCompleted) return "bg-blue-500";
        const date = new Date(goal.dueDate);
        if (isPast(date) && !isToday(date)) return "bg-red-400";
        return "bg-blue-500";
    };

    if (filtered.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400 dark:text-gray-500">
                {selectedDate ? "No goals due this day" : "No goals yet"}
            </div>
        );
    }
    return (
        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {filtered.map((goal) => {
                const progress = getProgress(goal);
                const isUpdating = updatingGoal === goal.id;

                return (
                    <div
                        key={goal.id}
                        className={cn(
                            "group rounded-lg border border-slate-100 px-4 py-3 transition-colors dark:border-white/10",
                            "hover:bg-slate-50 dark:hover:bg-white/5",
                            goal.isCompleted && "opacity-50"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleToggleComplete(goal.id, goal.isCompleted)}
                                disabled={isUpdating}
                                className="flex-shrink-0 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors disabled:opacity-40"
                            >
                                {goal.isCompleted
                                    ? <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                    : <Circle className="h-5 w-5" />
                                }
                            </button>
                            <span className={cn(
                                "min-w-0 flex-1 text-sm font-medium",
                                goal.isCompleted
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-gray-800 dark:text-gray-100"
                            )}>
                                {goal.title}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2.5 ml-8 space-y-1">
                            <div className="h-[2px] w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", getProgressColor(goal))}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="block text-right text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500">
                                {getProgressLabel(goal)}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
