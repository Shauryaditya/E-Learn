"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Trash2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "./goal-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Goal {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date;
    isCompleted: boolean;
    studentId: string;
    teacherId: string;
}

interface GoalsManagementProps {
    courseId: string;
    enrolledStudents: string[];
    initialGoals: Goal[];
}

export const GoalsManagement = ({
    courseId,
    enrolledStudents,
    initialGoals,
}: GoalsManagementProps) => {
    const [goals, setGoals] = useState<Goal[]>(initialGoals);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (goalId: string) => {
        try {
            setIsDeleting(goalId);
            await axios.delete(`/api/goals/${goalId}`);
            setGoals(goals.filter((g) => g.id !== goalId));
            toast.success("Goal deleted successfully");
        } catch (error) {
            toast.error("Failed to delete goal");
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCreateSuccess = (newGoal: Goal) => {
        setGoals([...goals, newGoal]);
        setIsCreateOpen(false);
        toast.success("Goal created successfully");
    };

    const handleEditSuccess = (updatedGoal: Goal) => {
        setGoals(goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
        setEditingGoal(null);
        toast.success("Goal updated successfully");
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex justify-end">
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                </Button>
            </div>

            {/* Goals List */}
            <div className="space-y-4">
                {goals.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">
                            No goals created yet. Create your first goal to get started.
                        </p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div
                            key={goal.id}
                            className="border rounded-lg p-4 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {goal.title}
                                    </h3>
                                    {goal.description && (
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            {goal.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span>Due: {formatDate(goal.dueDate)}</span>
                                        <span>Student ID: {goal.studentId.slice(0, 8)}...</span>
                                        <span
                                            className={`px-2 py-1 rounded ${goal.isCompleted
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                }`}
                                        >
                                            {goal.isCompleted ? "Completed" : "Pending"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingGoal(goal)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(goal.id)}
                                        disabled={isDeleting === goal.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Goal Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Goal</DialogTitle>
                    </DialogHeader>
                    <GoalForm
                        courseId={courseId}
                        enrolledStudents={enrolledStudents}
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Goal Dialog */}
            <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Goal</DialogTitle>
                    </DialogHeader>
                    {editingGoal && (
                        <GoalForm
                            courseId={courseId}
                            enrolledStudents={enrolledStudents}
                            existingGoal={editingGoal}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setEditingGoal(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
