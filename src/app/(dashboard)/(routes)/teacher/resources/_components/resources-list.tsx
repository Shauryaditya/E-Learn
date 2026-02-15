
"use client";

import { Resource } from "@prisma/client";
import { Trash, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ResourcesListProps {
  items: Resource[];
}

export const ResourcesList = ({ items }: ResourcesListProps) => {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const onDelete = async (id: string) => {
        try {
            setDeletingId(id);
            await axios.delete(`/api/resources?resourceId=${id}`);
            toast.success("Resource deleted");
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        } finally {
            setDeletingId(null);
        }
    }

    if (items.length === 0) {
        return (
            <div className="text-center text-muted-foreground mt-10">
                No resources found. Upload one to get started.
            </div>
        )
    }

  return (
    <div className="space-y-4">
        {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-sky-100 dark:bg-sky-900/20 rounded-md">
                        <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">{item.title}</h3>
                        <div className="flex gap-2 mt-1">
                             <Badge variant="outline">{item.category}</Badge>
                             <Badge variant="secondary">{item.type}</Badge>
                             <span className="text-xs text-muted-foreground flex items-center">{item.subject} • {item.year || "No Year"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={item.url} target="_blank">
                        <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button 
                        onClick={() => onDelete(item.id)} 
                        variant="destructive" 
                        size="sm"
                        disabled={deletingId === item.id}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        ))}
    </div>
  )
}
