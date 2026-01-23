"use client";

import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
}

interface GoalFormProps {
    courseId: string;
    enrolledStudents: string[];
    existingGoal?: Goal;
    onSuccess: (goal: Goal) => void;
    onCancel: () => void;
}

export const GoalForm = ({
    courseId,
    enrolledStudents,
    existingGoal,
    onSuccess,
    onCancel,
}: GoalFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(
        existingGoal?.studentId || ""
    );

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            title: existingGoal?.title || "",
            description: existingGoal?.description || "",
            dueDate: existingGoal?.dueDate
                ? new Date(existingGoal.dueDate).toISOString().split("T")[0]
                : "",
        },
    });

    const onSubmit = async (data: any) => {
        try {
            setIsSubmitting(true);

            if (!selectedStudent && !existingGoal) {
                alert("Please select a student");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                title: data.title,
                description: data.description || null,
                dueDate: new Date(data.dueDate).toISOString(),
                studentId: selectedStudent,
            };

            let response;
            if (existingGoal) {
                // Update existing goal
                response = await axios.patch(`/api/goals/${existingGoal.id}`, payload);
            } else {
                // Create new goal
                response = await axios.post(`/api/courses/${courseId}/goals`, payload);
            }

            onSuccess(response.data);
        } catch (error) {
            console.error("Error submitting goal:", error);
            alert("Failed to save goal. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Student Selector (only for new goals) */}
            {!existingGoal && (
                <div className="space-y-2">
                    <Label htmlFor="student">Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                            {enrolledStudents.map((studentId) => (
                                <SelectItem key={studentId} value={studentId}>
                                    {studentId.slice(0, 16)}...
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    {...register("title", { required: "Title is required" })}
                    placeholder="e.g., Complete Chapter 5"
                />
                {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Add details about this goal..."
                    rows={3}
                />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate", { required: "Due date is required" })}
                />
                {errors.dueDate && (
                    <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : existingGoal ? "Update" : "Create"}
                </Button>
            </div>
        </form>
    );
};
