import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id || !user.emailAddresses?.[0]?.emailAddress) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const series = await db.testSeries.findUnique({
      where: { id: params.testSeriesId, isPublished: true },
      select: { id: true, title: true, price: true },
    });
    if (!series) return new NextResponse("Test series not found", { status: 404 });

    // Prevent duplicate purchases
    const existing = await db.testSeriesPurchase.findUnique({
      where: { userId_testSeriesId: { userId: user.id, testSeriesId: series.id } },
    });
    if (existing) return new NextResponse("Already purchased", { status: 400 });

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const amountPaise = Math.round((series.price ?? 0) * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `ts_${series.id.slice(0, 10)}_${Date.now().toString().slice(-6)}`,
      notes: { userId: user.id, testSeriesId: series.id, title: series.title },
    });

    // return exactly what the client needs
    return NextResponse.json({
      order,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID, // for convenience
    });
  } catch (error) {
    console.error("[TEST_SERIES_CHECKOUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
