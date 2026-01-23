"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, FileText } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Goal {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date;
    isCompleted: boolean;
    studentId: string;
    teacherId: string;
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

interface GoalsListProps {
    initialGoals: Goal[];
}

type FilterType = "all" | "pending" | "completed" | "overdue";

export const GoalsList = ({ initialGoals }: GoalsListProps) => {
    const [goals, setGoals] = useState<Goal[]>(initialGoals);
    const [filter, setFilter] = useState<FilterType>("all");
    const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);

    const handleToggleComplete = async (goalId: string, currentStatus: boolean) => {
        try {
            setUpdatingGoal(goalId);
            const response = await axios.patch(`/api/goals/${goalId}`, {
                isCompleted: !currentStatus,
            });

            setGoals(goals.map((g) => (g.id === goalId ? response.data : g)));
            toast.success(
                !currentStatus ? "Goal marked as completed" : "Goal marked as pending"
            );
        } catch (error) {
            toast.error("Failed to update goal");
        } finally {
            setUpdatingGoal(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const isOverdue = (dueDate: Date, isCompleted: boolean) => {
        if (isCompleted) return false;
        return new Date(dueDate) < new Date();
    };

    const filterGoals = (goals: Goal[]): Goal[] => {
        const now = new Date();
        switch (filter) {
            case "pending":
                return goals.filter((g) => !g.isCompleted);
            case "completed":
                return goals.filter((g) => g.isCompleted);
            case "overdue":
                return goals.filter((g) => !g.isCompleted && new Date(g.dueDate) < now);
            default:
                return goals;
        }
    };

    const filteredGoals = filterGoals(goals);

    // Group goals by course/test series
    const groupedGoals = filteredGoals.reduce((acc, goal) => {
        const key = goal.course
            ? `course-${goal.course.id}`
            : `testseries-${goal.testSeries?.id}`;
        if (!acc[key]) {
            acc[key] = {
                name: goal.course?.title || goal.testSeries?.title || "Unknown",
                type: goal.course ? "Course" : "Test Series",
                goals: [],
            };
        }
        acc[key].goals.push(goal);
        return acc;
    }, {} as Record<string, { name: string; type: string; goals: Goal[] }>);

    return (
        <div className="space-y-6">
            {/* Filter and Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Goals
                </h2>
                <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Goals</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Goals List */}
            {Object.keys(groupedGoals).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                        No goals found. Your teachers will set goals for you.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedGoals).map(([key, group]) => (
                        <div key={key} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                            {/* Group Header */}
                            <div className="flex items-center gap-2 mb-4">
                                {group.type === "Course" ? (
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                ) : (
                                    <FileText className="h-5 w-5 text-purple-600" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {group.name}
                                </h3>
                                <Badge variant="outline">{group.type}</Badge>
                            </div>

                            {/* Goals in this group */}
                            <div className="space-y-3">
                                {group.goals.map((goal) => (
                                    <div
                                        key={goal.id}
                                        className={`border rounded-lg p-4 ${isOverdue(goal.dueDate, goal.isCompleted)
                                            ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                                            : "border-gray-200 dark:border-gray-700"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                checked={goal.isCompleted}
                                                onCheckedChange={() =>
                                                    handleToggleComplete(goal.id, goal.isCompleted)
                                                }
                                                disabled={updatingGoal === goal.id}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <h4
                                                    className={`font-semibold ${goal.isCompleted
                                                        ? "line-through text-gray-500 dark:text-gray-400"
                                                        : "text-gray-900 dark:text-white"
                                                        }`}
                                                >
                                                    {goal.title}
                                                </h4>
                                                {goal.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {goal.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-4 w-4" />
                                                        {formatDate(goal.dueDate)}
                                                    </div>
                                                    {isOverdue(goal.dueDate, goal.isCompleted) && (
                                                        <Badge variant="destructive">Overdue</Badge>
                                                    )}
                                                    {goal.isCompleted && (
                                                        <Badge className="bg-green-500">Completed</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
