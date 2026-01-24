"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import Script from "next/script";
import { useRouter } from "next/navigation";

interface TestSeriesEnrollButtonProps {
  price: number;
  testSeriesId: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const TestSeriesEnrollButton = ({ price, testSeriesId }: TestSeriesEnrollButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(true);

  const orderRef = useRef<{ id: string; amount: number; currency: string } | null>(null);
  const keyIdRef = useRef<string>("");

  // guards to prevent duplicate calls in dev Strict Mode
  const mountedRef = useRef(false);
  const creatingRef = useRef(false);

  const createOrder = useCallback(async () => {
    if (creatingRef.current) return;          // prevent concurrent calls
    creatingRef.current = true;
    try {
      setIsOrderLoading(true);
      const res = await axios.post(`/api/testseries/${testSeriesId}/checkout`);
      if (res.status === 200 && res.data?.order?.id) {
        orderRef.current = {
          id: res.data.order.id,
          amount: res.data.order.amount,
          currency: res.data.order.currency,
        };
        keyIdRef.current = res.data.keyId;
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } catch (err) {
      console.error("TS createOrder error:", err);
      toast.error("Something went wrong while creating the order.");
    } finally {
      setIsOrderLoading(false);
      creatingRef.current = false;
    }
  }, [testSeriesId]);

  useEffect(() => {
    if (mountedRef.current) return;           // Strict Mode remount guard
    mountedRef.current = true;
    createOrder();
  }, [createOrder]);

  const processPayment = async () => {
    // fallback: if no order yet (e.g., user clicked fast), create it now
    if (!orderRef.current?.id) {
      await createOrder();
      if (!orderRef.current?.id) {
        toast.error("Order not created. Please try again.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const options = {
        key: keyIdRef.current || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRef.current.amount,
        currency: orderRef.current.currency,
        name: "Aaccent",
        description: "Test Series Purchase",
        order_id: orderRef.current.id,
        handler: async (response: any) => {
          try {
            await axios.post(`/api/testseries/${testSeriesId}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful! You can now access this test series.");
            router.refresh();                 // ✅ refresh the page after verification
          } catch (e: any) {
            console.error("Verify failed:", e?.response?.data || e);
            toast.error("Payment verification failed.");
          }
        },
        theme: { color: "#3399cc" },
        modal: { ondismiss: () => toast.error("Payment was cancelled.") },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
      });
      razorpay.open();
    } catch (err) {
      console.error("TS processPayment error:", err);
      toast.error("Something went wrong during payment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isOrderLoading) {
    return (
      <div className="container h-screen flex justify-center items-center">
        <p className="text-lg">Creating order...</p>
      </div>
    );
  }

  return (
    <>
      <Script
        id="razorpay-sdk"
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
        {isLoading ? "Processing..." : `Enroll for ${formatPrice(price)}`}
      </Button>
    </>
  );
};
