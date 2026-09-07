"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContestRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button variant="outline" size="icon" disabled={pending} title="Refresh submissions" aria-label="Refresh submissions"
    onClick={() => startTransition(() => router.refresh())}>
    <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
  </Button>;
}
