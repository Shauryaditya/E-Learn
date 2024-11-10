"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import axios from "axios";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
};

interface CourseEnrollButtonProps {
  price: number;
  courseId: string;
}

export const CourseEnrollButton = ({ price, courseId }: CourseEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      // Load Razorpay script before initializing payment
      await loadRazorpayScript();

      // Create order on the server
      const response = await axios.post(`/api/courses/${courseId}/checkout`);
      const { order, key } = response.data;
        console.log("Response>>??",response)
      // Setup Razorpay options
      const options = {
        key: key, // Razorpay key ID from the server
        amount: order.amount,
        currency: order.currency,
        name: "Aaccent",
        description: "Test Transaction",
        order_id: order.id, // Razorpay order ID created in the backend
        callback_url: "http://localhost:3000/payment-success", // Your success URL
        prefill: {
          name: "John Doe",
          email: "john.doe@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#F37254",
        },
        handler: (response: any) => {
          // Handle successful payment here
          console.log("Payment successful", response);
        },
        modal: {
          ondismiss: () => {
            console.log("Payment modal closed");
          },
        },
      };

      // Open Razorpay Checkout
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Error initiating payment", error);
      toast.error("Something went wrong with the payment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={onClick} disabled={isLoading} size="sm" className="w-full md:w-auto">
      Enroll for {formatPrice(price)}
    </Button>
  );
};
