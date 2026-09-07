"use client";

import Link from "next/link";
import { BookOpen, ChevronDown, Notebook, Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function TeacherCreateMenu() {
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem asChild><Link href="/teacher/create-contest"><Trophy className="mr-2 h-4 w-4" />New contest</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/teacher/create"><BookOpen className="mr-2 h-4 w-4" />New course</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link href="/teacher/create-testseries"><Notebook className="mr-2 h-4 w-4" />New test series</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}
