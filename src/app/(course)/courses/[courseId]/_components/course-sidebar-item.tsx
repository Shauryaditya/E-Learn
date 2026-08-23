"use client"

import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface CourseSidebarItemProps {
    label: string;
    id: string;
    isCompleted: boolean;
    courseId: string;
    isLocked: boolean;
    requiresSignIn?: boolean;
}
export const CourseSidebarItem = ({
    label,
    id,
    isCompleted,
    courseId,
    isLocked,
    requiresSignIn = false
}: CourseSidebarItemProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const { openSignIn } = useClerk();

    const Icon = isLocked || requiresSignIn ? Lock : (isCompleted ? CheckCircle : PlayCircle)
    const isActive = pathname?.includes(id);

    const onClick = () =>{
        if (requiresSignIn) {
            openSignIn({
                afterSignInUrl: `/courses/${courseId}/chapters/${id}`,
                afterSignUpUrl: `/courses/${courseId}/chapters/${id}`,
            });
            return;
        }

        router.push(`/courses/${courseId}/chapters/${id}`)
    }


    return (
   
            <button 
            onClick={onClick}
            type="button"
            className={cn(
                "flex items-center gap-x-2 text-muted-foreground text-sm font-[500] pl-6 transition-all hover:text-foreground hover:bg-muted",
                isActive && "text-foreground bg-muted hover:bg-muted hover:text-foreground",
                isCompleted && "text-emerald-700 hover:text-emerald-700",
                isCompleted && isActive && "bg-emerald-200/20"

            )}
            >
                <div className="flex items-center gap-x-2 py-4">
                    <Icon
                    size={22}
                    className={cn(
                        "text-muted-foreground ",
                        isActive && "text-foreground",
                        isCompleted && "text-emerald-700"
                    )}
                    />
                    {label}
                </div>
                <div className={cn("ml-auto opacity-0 border-2 border-foreground h-full transition-all",
                    isActive && "opacity-100",
                    isCompleted && "text-emerald-700 hover:text-emerald-700",
                    isActive && isCompleted && "border-emerald-700 bg-emerald-700"
                    )}>
                </div>
            </button>
           
    )
}
