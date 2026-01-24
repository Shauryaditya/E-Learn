import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify the course exists and the teacher owns it
        const course = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId, // Teacher must own the course
            },
        });

        if (!course) {
            return new NextResponse("Course not found or unauthorized", { status: 404 });
        }

        const { title, description, dueDate, studentId } = await req.json();

        if (!title || !dueDate || !studentId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify the student is enrolled in this course
        const purchase = await db.purchase.findUnique({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId: params.courseId,
                },
            },
        });

        if (!purchase) {
            return new NextResponse("Student not enrolled in this course", { status: 403 });
        }

        // Create the goal
        const goal = await db.goal.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                studentId,
                teacherId: userId,
                courseId: params.courseId,
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        console.error("[COURSE_GOALS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { courseId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is the teacher or a student
        const course = await db.course.findUnique({
            where: {
                id: params.courseId,
            },
        });

        if (!course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        const isTeacher = course.userId === userId;

        if (isTeacher) {
            // Teacher: Return all goals for this course
            const goals = await db.goal.findMany({
                where: {
                    courseId: params.courseId,
                },
                orderBy: {
                    dueDate: "asc",
                },
            });
            return NextResponse.json(goals);
        } else {
            // Student: Return only their goals
            const goals = await db.goal.findMany({
                where: {
                    courseId: params.courseId,
                    studentId: userId,
                },
                orderBy: {
                    dueDate: "asc",
                },
            });
            return NextResponse.json(goals);
        }
    } catch (error) {
        console.error("[COURSE_GOALS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
