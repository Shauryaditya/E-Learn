

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { ResourceCategory, ResourceType } from "@prisma/client";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  url: z.string().url(),
  category: z.nativeEnum(ResourceCategory),
  type: z.nativeEnum(ResourceType),
  subject: z.string().trim().min(1).max(80),
  grade: z.string().trim().max(40).optional().nullable(),
  year: z.number().int().min(1990).max(new Date().getFullYear()).optional().nullable(),
  schoolName: z.string().trim().max(160).optional().nullable(),
  board: z.string().trim().max(80).optional().nullable(),
  examType: z.string().trim().max(80).optional().nullable(),
  isPaid: z.boolean().optional().default(false),
}).superRefine((value, context) => {
  if (value.category !== ResourceCategory.SCHOOL) return;
  for (const field of ["schoolName", "board", "grade", "examType"] as const) {
    if (!value[field]) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Required for school papers" });
  }
  if (!value.year) context.addIssue({ code: z.ZodIssueCode.custom, path: ["year"], message: "Required for school papers" });
});

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const parsed = resourceSchema.safeParse(await req.json());

    if (!userId || !isTeacher(userId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid resource details", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const resource = await db.resource.create({
      data: parsed.data,
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.log("[RESOURCES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!userId || !isTeacher(userId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!resourceId) {
        return new NextResponse("Resource ID missing", { status: 400 });
    }

    const deletedResource = await db.resource.delete({
      where: {
        id: resourceId,
      },
    });

    return NextResponse.json(deletedResource);
  } catch (error) {
    console.log("[RESOURCE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
