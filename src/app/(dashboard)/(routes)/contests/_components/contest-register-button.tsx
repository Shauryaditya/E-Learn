"use client";

import axios from "axios";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

interface ContestRegisterButtonProps {
  contestId: string;
  isRegistered: boolean;
  registrationClosed: boolean;
}

export const ContestRegisterButton = ({
  contestId,
  isRegistered,
  registrationClosed,
}: ContestRegisterButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onRegister = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/contests/${contestId}/register`);
      toast.success("Registered for contest");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || "Could not register");
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <Button
        disabled
        className="w-full border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
        variant="outline"
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Registered
      </Button>
    );
  }

  return (
    <Button
      onClick={onRegister}
      disabled={registrationClosed || isLoading}
      className="w-full bg-blue-300 text-blue-950 hover:bg-blue-200"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {registrationClosed ? "Registration Closed" : "Register Now"}
    </Button>
  );
};
