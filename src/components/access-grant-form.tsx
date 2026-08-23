"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccessGrantFormProps {
  endpoint: string;
  grantedCount: number;
  label: string;
}

export const AccessGrantForm = ({
  endpoint,
  grantedCount,
  label,
}: AccessGrantFormProps) => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await axios.post(endpoint, { studentIdentifier: identifier });
      toast.success("Access granted successfully");
      setIdentifier("");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || "Could not grant access");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2 rounded-md border bg-slate-100 p-4 dark:bg-slate-800">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Grant student access
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {grantedCount} {grantedCount === 1 ? "student has" : "students have"} access.
          </p>
        </div>
        <KeyRound className="h-5 w-5 text-slate-500" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="student@email.com or Clerk user ID"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={isSubmitting || identifier.trim().length === 0}
          className="shrink-0"
        >
          {isSubmitting ? "Granting..." : label}
        </Button>
      </form>
    </div>
  );
};
