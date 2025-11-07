// app/(course)/testseries/[testSeriesId]/_components/test-series-enroll-button.tsx

"use client";

import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface TestSeriesEnrollButtonProps {
  price: number;
  testSeriesId: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const TestSeriesEnrollButton = ({
  price,
  testSeriesId,
}: TestSeriesEnrollButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    try {
      setIsLoading(true);

      const response = await axios.post(`/api/testseries/${testSeriesId}/checkout`);
        console.log("Razorpay Order Response:", response.data);
      const options = {
        key: response.data.keyId,
        amount: response.data.amount,
        currency: response.data.currency,
        name: "Test Series Purchase",
        description: "Purchase test series",
        order_id: response.data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            await axios.post(`/api/testseries/${testSeriesId}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful! You can now access the test series.");
            router.refresh();
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response: any) {
        toast.error("Payment failed. Please try again.");
      });

    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      size="sm"
      className="w-full md:w-auto"
    >
      Enroll for {formatPrice(price)}
    </Button>
  )
}