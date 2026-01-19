"use client";

import axios from "axios";
import { Trash } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";

interface TestChapterActionsProps {
  disabled: boolean;
  testSeriesId: string;
  testChapterId: string;
  isPublished: boolean;
}

export const TestChapterActions = ({
  disabled,
  testSeriesId,
  testChapterId,
  isPublished
}: TestChapterActionsProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(`/api/testseries/${testSeriesId}/testChapter/${testChapterId}/unpublish`);
        toast.success("Chapter unpublished");
      } else {
        await axios.patch(`/api/testseries/${testSeriesId}/testChapter/${testChapterId}/publish`);
        toast.success("Chapter published");
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/testseries/${testSeriesId}/chapters/${testChapterId}`);

      toast.success("Chapter deleted");
      router.refresh();
      router.push(`/teacher/testseries/${testSeriesId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-x-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
        size="sm"
      >
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button size="sm" disabled={isLoading}>
          <Trash className="h-4 w-4" />
        </Button>
      </ConfirmModal>
    </div>
  )
}