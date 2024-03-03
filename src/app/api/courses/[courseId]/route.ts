import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }:  { params: { courseId: string }}
) {
    try{
    const { userId } = auth();
    const { courseId } = params;


    if(!userId){
        return new NextResponse("Unauthorized", {})
    }
} catch (error) {
    console.log("[COURSE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 })
}
}