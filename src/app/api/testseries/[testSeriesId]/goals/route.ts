import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: { testSeriesId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify the test series exists and the teacher owns it
        const testSeries = await db.testSeries.findUnique({
            where: {
                id: params.testSeriesId,
                userId, // Teacher must own the test series
            },
        });

        if (!testSeries) {
            return new NextResponse("Test series not found or unauthorized", { status: 404 });
        }

        const { title, description, dueDate, studentId } = await req.json();

        if (!title || !dueDate || !studentId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify the student is enrolled in this test series
        const purchase = await db.testSeriesPurchase.findUnique({
            where: {
                userId_testSeriesId: {
                    userId: studentId,
                    testSeriesId: params.testSeriesId,
                },
            },
        });

        if (!purchase) {
            return new NextResponse("Student not enrolled in this test series", { status: 403 });
        }

        // Create the goal
        const goal = await db.goal.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                studentId,
                teacherId: userId,
                testSeriesId: params.testSeriesId,
            },
        });

        return NextResponse.json(goal);
    } catch (error) {
        console.error("[TESTSERIES_GOALS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { testSeriesId: string } }
) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is the teacher or a student
        const testSeries = await db.testSeries.findUnique({
            where: {
                id: params.testSeriesId,
            },
        });

        if (!testSeries) {
            return new NextResponse("Test series not found", { status: 404 });
        }

        const isTeacher = testSeries.userId === userId;

        if (isTeacher) {
            // Teacher: Return all goals for this test series
            const goals = await db.goal.findMany({
                where: {
                    testSeriesId: params.testSeriesId,
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
                    testSeriesId: params.testSeriesId,
                    studentId: userId,
                },
                orderBy: {
                    dueDate: "asc",
                },
            });
            return NextResponse.json(goals);
        }
    } catch (error) {
        console.error("[TESTSERIES_GOALS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
