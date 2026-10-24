import { db } from "@/lib/db";
import { broadcastNotification } from "@/lib/notifications";
import { auth } from "@clerk/nextjs"
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server"

export async function PATCH (
    req: Request,
    { params }: { params: { courseId: string}}
) {
    try {
        const { userId } = auth();

        if(!userId){
            return new NextResponse("Unauthorized", {status: 401})
        }

        const course = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId,
            },
            include: {
                chapters: {
                    include: {
                        muxData: true
                    }
                }
            }
        })

        if(!course){
            return new NextResponse("Course not found", {status: 404})
        }

        const hasPublishedChapter = course.chapters.some((chapter) => chapter.isPublished)
        if(!course.title || !course.description || !course.imageUrl || !course.categoryId || !hasPublishedChapter){
            return new NextResponse("Invalid course data", {status: 401})
        }

        const publishedCourse = await db.course.update({
            where: {
                id: params.courseId,
                userId
            },
            data: {
                isPublished: true
            }
        });

        if (!course.isPublished) {
            try {
                await broadcastNotification({
                    eventKey: `course:${course.id}:published`,
                    type: NotificationType.COURSE_PUBLISHED,
                    title: "New course available",
                    body: `${course.title} is now available on Aaccent.`,
                    href: `/courses/${course.id}`,
                    publisherId: userId,
                });
            } catch (error) {
                console.error("[COURSE_PUBLISH_NOTIFICATION]", error);
            }
        }

        return NextResponse.json(publishedCourse)
    } catch (error) {
        console.log("[COURSE_ID_PUBLISH]",error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
