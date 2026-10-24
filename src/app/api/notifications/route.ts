import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);

  return NextResponse.json({ notifications, unreadCount }, { headers: { "Cache-Control": "no-store" } });
}

const updateSchema = z.object({
  notificationId: z.string().uuid().optional(),
  all: z.boolean().optional(),
}).refine(value => value.all || value.notificationId, "Select a notification");

export async function PATCH(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const input = updateSchema.safeParse(await req.json());
  if (!input.success) return new NextResponse("Invalid request", { status: 400 });

  const result = await db.notification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(input.data.all ? {} : { id: input.data.notificationId }),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ updated: result.count });
}
