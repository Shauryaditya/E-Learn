import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { userId } = auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch all goals for the logged-in student
        const goals = await db.goal.findMany({
            where: {
                studentId: userId,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                    },
                },
                testSeries: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: {
                dueDate: "asc",
            },
        });

        return NextResponse.json(goals);
    } catch (error) {
        console.error("[STUDENT_GOALS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
