"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeacherDashboardError({ reset }: { reset: () => void }) {
  return <div role="alert" className="space-y-4 p-6">
    <p>Your dashboard could not be loaded. Please try again.</p>
    <Button variant="outline" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
  </div>;
}
