

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId || !isTeacher(userId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resource = await db.resource.create({
      data: {
        ...values,
      },
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
