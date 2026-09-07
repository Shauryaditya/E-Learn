"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <AlertTriangle className="mb-4 h-8 w-8 text-amber-600" />
      <h1 className="text-xl font-semibold">Analytics could not be loaded</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your teaching data is unchanged. Try loading this view again.</p>
      <Button className="mt-5" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
    </div>
  );
}
