import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import razorpay from "@/lib/razorpay";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    // Log at the start of the function
    console.log("Starting POST request for course checkout");

    const user = await currentUser();
    if (!user || !user.id || !user.emailAddresses?.[0]?.emailAddress) {
      console.error("Unauthorized: User not logged in or missing email");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("User fetched:", user.id);

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
    });

    console.log("Course fetched:", course);
    console.log("Key ID:", process.env.RAZORPAY_KEY_ID);
    console.log("Key Secret:", process.env.RAZORPAY_KEY_SECRET);

    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });
    if (purchase) {
      console.error("Purchase already exists for user and course:", purchase);
      return new NextResponse("Already purchased", { status: 400 });
    }

    if (!course) {
      console.error("Course not found:", params.courseId);
      return new NextResponse("Course not found", { status: 404 });
    }

    // Razorpay Order Creation
    const order = await razorpay.orders.create({
      amount: Math.round(course.price! * 100),
      currency: "INR",
      receipt: `receipt_${params.courseId}_${Date.now()}`,
      notes: {
        userId: user.id,
        courseId: params.courseId,
      },
    });
    console.log("Razorpay order created:", order);

    await db.razorpayOrder.create({
      data: {
        userId: user.id,
        razorpayOrderId: order.id,
        amount: course.price!,
        currency: "INR",
        status: order.status,
        receipt: order.receipt,
        courseId: params.courseId,
      },
    });
    console.log("Order saved in database successfully");

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("[COURSE_ID_CHECKOUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
