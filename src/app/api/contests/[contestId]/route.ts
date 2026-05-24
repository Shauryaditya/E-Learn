import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const allowedFields = [
  "title",
  "description",
  "imageUrl",
  "price",
  "startsAt",
  "durationMinutes",
  "registrationOpensAt",
  "registrationClosesAt",
  "maxParticipants",
  "categoryId",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = allowedFields.reduce<Record<string, unknown>>((acc, field) => {
      if (values[field] === undefined) return acc;

      if (
        field === "startsAt" ||
        field === "registrationOpensAt" ||
        field === "registrationClosesAt"
      ) {
        acc[field] = values[field] ? new Date(values[field]) : null;
        return acc;
      }

      if (field === "durationMinutes" || field === "maxParticipants" || field === "price") {
        acc[field] = values[field] === "" || values[field] === null
          ? null
          : Number(values[field]);
        return acc;
      }

      acc[field] = values[field] || null;
      return acc;
    }, {});

    const contest = await db.contest.update({
      where: {
        id: params.contestId,
        userId,
      },
      data,
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTEST_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { contestId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.delete({
      where: {
        id: params.contestId,
        userId,
      },
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTEST_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
