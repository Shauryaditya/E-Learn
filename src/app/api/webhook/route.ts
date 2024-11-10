import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import crypto from "crypto";

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    // Verify the webhook signature
    const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

    if (signature !== expectedSignature) {
        return res.status(400).json({ message: "Invalid signature" });
    }

    const { event, payload } = req.body;

    try {
        if (event === "payment.captured") {
            const paymentId = payload.payment.entity.id;
            const razorpayOrderId = payload.payment.entity.order_id;

            // Find the corresponding Razorpay order
            const razorpayOrder = await db.razorpayOrder.findUnique({
                where: { razorpayOrderId }
            });

            if (!razorpayOrder) {
                return res.status(404).json({ message: "Order not found" });
            }

            // Mark the purchase as completed
            await db.purchase.create({
                data: {
                    userId: razorpayOrder.userId,
                    courseId: razorpayOrder.courseId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // Optionally, update the Razorpay order's status
            await db.razorpayOrder.update({
                where: { id: razorpayOrder.id },
                data: { status: "captured" }
            });

            return res.status(200).json({ message: "Payment processed successfully" });
        }
        
        // Handle other events as needed
    } catch (error) {
        console.error("Error handling Razorpay webhook:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
