// app/(dashboard)/teacher/test-series/[testSeriesId]/_components/SeriesPublishToggle.tsx
"use client";

import { useState, useTransition } from "react";

export default function SeriesPublishToggle({
  testSeriesId,
  initialPublished,
}: {
  testSeriesId: string;
  initialPublished: boolean;
}) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [isPending, startTransition] = useTransition();

  const onToggle = () => {
    startTransition(async () => {
      const url = isPublished
        ? `/api/test-series/${testSeriesId}/unpublish`
        : `/api/test-series/${testSeriesId}/publish`;

      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) {
        // Revert on failure
        alert(`Failed to ${isPublished ? "unpublish" : "publish"} series`);
        return;
      }
      setIsPublished((p) => !p);
    });
  };

  return (
    <button
      onClick={onToggle}
      disabled={isPending}
      className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
    >
      {isPending
        ? "Saving..."
        : isPublished
        ? "Unpublish Test Series"
        : "Publish Test Series"}
    </button>
  );
}
