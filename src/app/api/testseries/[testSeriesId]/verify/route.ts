import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) return new NextResponse("Unauthorized", { status: 401 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // idempotent create
    const existing = await db.testSeriesPurchase.findUnique({
      where: { userId_testSeriesId: { userId: user.id, testSeriesId: params.testSeriesId } },
    });
    if (!existing) {
      await db.testSeriesPurchase.create({
        data: { userId: user.id, testSeriesId: params.testSeriesId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[TEST_SERIES_VERIFY]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
