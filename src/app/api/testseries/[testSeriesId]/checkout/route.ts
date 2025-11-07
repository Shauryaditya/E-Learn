// src/app/api/testseries/[testSeriesId]/checkout/route.ts
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

function wantsJson(req: Request) {
  const ct = req.headers.get("content-type") || "";
  return ct.toLowerCase().includes("application/json");
}

async function safeJson<T = any>(req: Request): Promise<T | undefined> {
  if (!wantsJson(req)) return undefined;
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Prefer the path param
    const testSeriesIdFromPath = params.testSeriesId;

    // Optionally accept a body, but don't crash if empty
    const body = await safeJson<{ testSeriesId?: string }>(req);
    const testSeriesId = testSeriesIdFromPath || body?.testSeriesId;

    if (!testSeriesId) {
      return new NextResponse("Missing testSeriesId", { status: 400 });
    }

    const series = await db.testSeries.findUnique({
      where: { id: testSeriesId },
      select: { id: true, isPublished: true, price: true, title: true },
    });
    if (!series) return new NextResponse("Test series not found", { status: 404 });
    if (!series.isPublished) {
      return new NextResponse("Test series is not published yet", { status: 403 });
    }

    // Idempotency: if already purchased, just return it
    const existing = await db.testSeriesPurchase.findUnique({
      where: { userId_testSeriesId: { userId, testSeriesId } },
    });
    if (existing) {
      return NextResponse.json({ message: "Already purchased", purchase: existing });
    }

    // TODO: add payment verification if price > 0
    const purchase = await db.testSeriesPurchase.create({
      data: { userId, testSeriesId },
    });

    return NextResponse.json({ message: "Purchase successful", purchase });
  } catch (err) {
    console.error("[TEST_SERIES_CHECKOUT]", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
