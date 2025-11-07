// app/api/testseries/[testSeriesId]/verify/route.ts

import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import crypto from "crypto";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // Create purchase record
    const purchase = await db.testSeriesPurchase.create({
      data: {
        userId: user.id,
        testSeriesId: params.testSeriesId,
      }
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error) {
    console.log("[TEST_SERIES_VERIFY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}