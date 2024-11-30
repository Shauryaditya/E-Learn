import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    console.log("Starting POST request for course checkout");

    // Fetch the current user
    const user = await currentUser();
    if (!user || !user.id || !user.emailAddresses?.[0]?.emailAddress) {
      console.error("Unauthorized: User not logged in or missing email");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.log("User fetched:", user.id);

    // Fetch the course details
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
    });
    if (!course) {
      console.error("Course not found:", params.courseId);
      return new NextResponse("Course not found", { status: 404 });
    }
    console.log("Course fetched:", course);

    // Check for existing purchase
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

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    console.log("Razorpay instance initialized");

    // Define Razorpay order options
    const orderOptions = {
      amount: Math.round(course.price! * 100), // Convert price to paise
      currency: "INR",
      receipt: `rec_${params.courseId}`, // Shortened unique receipt
      notes: {
        userId: user.id,
        courseId: params.courseId,
      },
    };
    console.log("Razorpay order options created:", orderOptions);

    // Create Razorpay order using async/await
    const order = await razorpay.orders.create(orderOptions);
    console.log("Razorpay order created:", order);

    // console.log("Razorpay order created:", order);

    // Save the Razorpay order to the database
    // await db.razorpayOrder.create({
    //   data: {
    //     userId: user.id,
    //     razorpayOrderId: order.id,
    //     amount: course.price!,
    //     currency: "INR",
    //     status: order.status,
    //     receipt: order.receipt,
    //     courseId: params.courseId,
    //   },
    // });
    console.log("Order saved in database successfully");

    // Return the Razorpay order details
    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("[COURSE_ID_CHECKOUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
