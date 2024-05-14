import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
export async function DELETE(
    req: Request,
    { params }: { params: { courseId: string, aattachmentId: string}}
) {
    try {
        const {userId} = auth();

        if(!userId){
            return new NextResponse("Unauthorized", { status: 401})
        }

        const couseOwner = await db.course.findUnique({
            where: {
                id: params.courseId,
                userId: userId
            },
        });

        if(!couseOwner) {
            return new NextResponse("Unauthorized", { status: 401})
        }

        const attachment = await db.attachment.delete({
            where: {
                courseId: params.courseId,
                id : params.aattachmentId
            }
        });

        return NextResponse.json(attachment)
    } catch (error) {
        console.log("ATTACHMENT_ID",error);
        return new NextResponse("Internal Error", {status: 500 })
    }
}