import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";

const generatedSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string
) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error(
      "Razorpay key secret is not defined in environment variables."
    );
  }
  const sig = crypto
    .createHmac("sha256", keySecret)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex");
  return sig;
};

export async function POST(request: NextRequest) {
  const {
    orderCreationId,
    razorpayPaymentId,
    razorpaySignature,
    userId,
    courseId,
  } = await request.json();

  const signature = generatedSignature(orderCreationId, razorpayPaymentId);
  if (signature !== razorpaySignature) {
    return NextResponse.json(
      { message: "payment verification failed", isOk: false },
      { status: 400 }
    );
  }

      // Validate user ID server-side
      const user = await currentUser(); // Fetch the current user
      if (!user || !user.id) {
        return NextResponse.json(
          { message: "User not authenticated", isOk: false },
          { status: 401 }
        );
      }
    // Check if purchase already exists
    const existingPurchase = await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });
  
      if (existingPurchase) {
        return NextResponse.json(
          { message: "Payment verified. Purchase already exists.", isOk: true },
          { status: 200 }
        );
      }
  
      // Create a new purchase record
      await db.purchase.create({
        data: {
          userId,
          courseId,
        },
      });
  
      return NextResponse.json(
        { message: "Payment verified and purchase recorded successfully!", isOk: true },
        { status: 200 }
      );
}
