"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface TestSeriesEnrollButtonProps {
  price: number;
  testSeriesId: string;
}

declare global {
  interface Window { Razorpay: any; }
}

export const TestSeriesEnrollButton = ({ price, testSeriesId }: TestSeriesEnrollButtonProps) => {
  const router = useRouter();
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    // Not logged in — push to sign in with return URL
    if (!userId) {
      router.push(`/sign-in?redirect_url=/testseries/${testSeriesId}`);
      return;
    }

    // Free enroll
    if (price === 0) {
      try {
        setIsLoading(true);
        await axios.post(`/api/testseries/${testSeriesId}/checkout`);
        toast.success("Enrolled successfully!");
        router.refresh();
      } catch {
        toast.error("Something went wrong.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Paid — create order then open Razorpay
    try {
      setIsLoading(true);
      const res = await axios.post(`/api/testseries/${testSeriesId}/checkout`);

      if (!res.data?.order?.id) {
        toast.error("Failed to create order. Please try again.");
        return;
      }

      const { order, keyId } = res.data;

      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Aaccent",
        description: "Test Series Purchase",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await axios.post(`/api/testseries/${testSeriesId}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful! You can now access this test series.");
            router.refresh();
          } catch {
            toast.error("Payment verification failed.");
          }
        },
        theme: { color: "#2563eb" },
        modal: { ondismiss: () => toast("Payment cancelled.") },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
      });
      razorpay.open();
    } catch (err) {
      console.error("Enroll error:", err);
      toast.error("Something went wrong during payment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        id="razorpay-sdk"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onError={() => toast.error("Failed to load Razorpay SDK")}
      />
      <Button
        onClick={handleClick}
        disabled={isLoading}
        size="lg"
        className="bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl px-8"
      >
        {isLoading
          ? "Please wait..."
          : price === 0
            ? "Enroll for Free"
            : `Enroll for ${formatPrice(price)}`
        }
      </Button>
    </>
  );
};