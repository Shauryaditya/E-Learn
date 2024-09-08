import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import customers from "razorpay/dist/types/customers";
import { use } from "react";

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!, // Load from environment variables
  key_secret: process.env.RAZORPAY_KEY_SECRET!, // Load from environment variables
});

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    // Ensure user is authenticated
    if (!user || !user.id || !user.emailAddresses?.[0]?.emailAddress) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch course details from DB
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        isPublished: true,
      },
    });

    // Check if user has already purchased the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: params.courseId,
        },
      },
    });

    if (purchase) {
      return new NextResponse("You have already purchased this course", {
        status: 400,
      });
    }

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: Math.round(course.price! * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_${params.courseId}_${user.id}`, // Unique receipt
      notes: {
        course_name: course.title,
        course_description: course.description || "",
        user_id: user.id,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    let razorpayCustomer = await db.razorpayCustomer.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        razorpayCustomerId: true,
      },
    });
    if (!razorpayCustomer) {
      const customer = await razorpayInstance.customers.create({
        email: user.emailAddresses[0].emailAddress,
      });

      razorpayCustomer = await db.razorpayCustomer.create({
        data: {
          userId: user.id,
          razorpayCustomerId: customer.id,
        },
      });
    }

    // Return the orderId and amount to the frontend for Razorpay Checkout
    return NextResponse.json({
      orderId: order.id, // Razorpay order id
      amount: order.amount,
      currency: order.currency,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${course.id}?cancel=1`,
    });
  } catch (error) {
    console.log("[COURSE_ID_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
