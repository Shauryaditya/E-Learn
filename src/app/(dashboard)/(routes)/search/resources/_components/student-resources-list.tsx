
"use client";

import { Resource } from "@prisma/client";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface StudentResourcesListProps {
  items: Resource[];
}

export const StudentResourcesList = ({ items }: StudentResourcesListProps) => {

    if (items.length === 0) {
        return (
            <div className="text-center text-muted-foreground mt-10">
                No resources found matching your criteria.
            </div>
        )
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition">
                <CardContent className="p-4 flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between">
                         <div className="p-2 bg-sky-100 dark:bg-sky-900/20 rounded-md">
                            <FileText className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                        </div>
                        <Badge variant={item.type === "PAST_PAPER" ? "default" : "secondary"}>
                            {item.type === "PAST_PAPER" ? "Past Paper" : item.type === "SAMPLE_PAPER" ? "Sample" : "Notes"}
                        </Badge>
                    </div>
                    
                    <div className="flex-1">
                         <h3 className="font-semibold text-foreground line-clamp-2" title={item.title}>
                             {item.title}
                         </h3>
                         <p className="text-xs text-muted-foreground mt-1">
                            {item.subject} • {item.grade || "General"} • {item.year || ""}
                         </p>
                    </div>

                    <Link href={item.url} target="_blank" className="w-full">
                        <Button className="w-full bg-sky-600 hover:bg-sky-700">
                            View / Download
                            <Download className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        ))}
    </div>
  )
}
