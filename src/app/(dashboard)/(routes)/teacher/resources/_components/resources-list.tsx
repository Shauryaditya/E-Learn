"use client";

import { Resource } from "@prisma/client";
import axios from "axios";
import { ExternalLink, FileText, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { resourceCategoryLabel, resourceTypeLabel } from "@/lib/resource-options";

export const ResourcesList = ({ items }: { items: Resource[] }) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(id: string) {
    try {
      setDeletingId(id);
      await axios.delete(`/api/resources?resourceId=${id}`);
      toast.success("Paper removed");
      router.refresh();
    } catch {
      toast.error("Could not remove this paper");
    } finally {
      setDeletingId(null);
    }
  }

  if (!items.length) {
    return <div className="border-y py-12 text-center text-sm text-muted-foreground">No papers have been added yet.</div>;
  }

  return (
    <div className="divide-y border-y">
      {items.map(item => (
        <article key={item.id} className="flex min-w-0 flex-col gap-4 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold" title={item.title}>{item.title}</h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {[item.schoolName, item.grade, item.subject, item.year].filter(Boolean).join(" / ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline">{resourceCategoryLabel(item.category)}</Badge>
                <Badge variant="secondary">{resourceTypeLabel(item.type)}</Badge>
                {item.examType && <Badge variant="outline">{item.examType}</Badge>}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
            <Button asChild variant="outline" size="icon" title="Open paper"><Link href={item.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></Link></Button>
            <Button type="button" onClick={() => onDelete(item.id)} variant="destructive" size="icon" disabled={deletingId === item.id} title="Delete paper">
              {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
};
