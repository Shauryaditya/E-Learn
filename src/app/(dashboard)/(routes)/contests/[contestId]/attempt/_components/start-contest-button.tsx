"use client";

import axios from "axios";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

interface StartContestButtonProps {
  contestId: string;
}

export const StartContestButton = ({ contestId }: StartContestButtonProps) => {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const onStart = async () => {
    try {
      setIsStarting(true);
      await axios.post(`/api/contests/${contestId}/start`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || "Could not start contest");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Button disabled={isStarting} onClick={onStart} type="button">
      {isStarting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      Start contest
    </Button>
  );
};
