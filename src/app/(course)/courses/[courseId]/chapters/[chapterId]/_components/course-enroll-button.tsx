"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import axios from "axios";
import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import Script from "next/script";
import { auth } from "@clerk/nextjs";

interface CourseEnrollButtonProps {
  price: number;
  courseId: string;
}

export const CourseEnrollButton = ({
  price,
  courseId,
}: CourseEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const orderIdRef = useRef<string | null>(null);

  // Create the Razorpay order
  const createOrder = useCallback(async () => {
    try {
      setIsOrderLoading(true);
      const response = await axios.post(`/api/courses/${courseId}/checkout`, {
        amount: price * 100, // Convert price to paise
      });

      if (response.status === 200) {
        // toast.success("Order created successfully");
        const { order } = response.data;
        console.log("Order Id>>?", order);
        orderIdRef.current = order.id; // Store the order ID for payment
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Something went wrong while creating the order.");
    } finally {
      setIsOrderLoading(false);
    }
  }, [courseId, price]);

  // Trigger payment processing
  const processPayment = async () => {
    const orderId = orderIdRef.current;

    if (!orderIdRef.current) {
      toast.error("Order not created. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Razorpay key ID
        amount: price * 100, // Amount in paise
        currency: "INR",
        name: "Aaccent",
        description: "Test Transaction",
        order_id: orderIdRef.current, // Order ID created earlier
        handler: async (response: any) => {
          const data = {
            orderCreationId: orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,

            courseId: courseId, // Replace with current course ID
          };

          // Verify payment
          const verifyResponse = await axios.post(`/api/webhook`, data);
          if (verifyResponse.status === 200) {
            toast.success("Payment successful!");
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#F37254",
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment process was interrupted.");
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (response: any) => {
        toast.error(response.error.description);
      });
      paymentObject.open();
    } catch (error) {
      console.error("Error during payment processing:", error);
      toast.error("Something went wrong during payment processing.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch order ID on mount
  useEffect(() => {
    createOrder();
  }, [createOrder]);

  // Show a loading state until the order is created
  if (isOrderLoading)
    return (
      <div className="container h-screen flex justify-center items-center">
        <p className="text-lg">Creating order...</p>
      </div>
    );

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onError={() => toast.error("Failed to load Razorpay SDK")}
      />
      <Button
        onClick={processPayment}
        disabled={isLoading}
        size="sm"
        className="w-full md:w-auto"
      >
        {isLoading ? "Processing..." : `Pay ${formatPrice(price)}`}
      </Button>
    </>
  );
};
