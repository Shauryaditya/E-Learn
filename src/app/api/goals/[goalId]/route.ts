import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { goalId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const goal = await db.goal.findUnique({
            where: {
                id: params.goalId,
            },
        });

        if (!goal) {
            return new NextResponse("Goal not found", { status: 404 });
        }

        const body = await req.json();
        const isTeacher = goal.teacherId === userId;
        const isStudent = goal.studentId === userId;

        if (!isTeacher && !isStudent) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Students can only update isCompleted status
        if (isStudent && !isTeacher) {
            if (Object.keys(body).length !== 1 || !("isCompleted" in body)) {
                return new NextResponse("Students can only update completion status", { status: 403 });
            }

            const updatedGoal = await db.goal.update({
                where: {
                    id: params.goalId,
                },
                data: {
                    isCompleted: body.isCompleted,
                },
            });

            return NextResponse.json(updatedGoal);
        }

        // Teachers can update any field
        const { title, description, dueDate, isCompleted } = body;
        const updateData: any = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

        const updatedGoal = await db.goal.update({
            where: {
                id: params.goalId,
            },
            data: updateData,
        });

        return NextResponse.json(updatedGoal);
    } catch (error) {
        console.error("[GOAL_PATCH]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { goalId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const goal = await db.goal.findUnique({
            where: {
                id: params.goalId,
            },
        });

        if (!goal) {
            return new NextResponse("Goal not found", { status: 404 });
        }

        // Only the teacher who created the goal can delete it
        if (goal.teacherId !== userId) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        await db.goal.delete({
            where: {
                id: params.goalId,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[GOAL_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
