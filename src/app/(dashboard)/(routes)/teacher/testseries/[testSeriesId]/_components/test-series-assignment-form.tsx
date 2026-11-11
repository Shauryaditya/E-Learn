"use client";

import axios from "axios";
import { ClipboardCheck, Loader2, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TestSeriesAssignmentFormProps = {
  testSeriesId: string;
  chapters: { id: string; title: string }[];
};

export const TestSeriesAssignmentForm = ({ testSeriesId, chapters }: TestSeriesAssignmentFormProps) => {
  const [studentIdentifier, setStudentIdentifier] = useState("");
  const [testChapterId, setTestChapterId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(`/api/testseries/${testSeriesId}/assign`, { studentIdentifier, testChapterId, dueDate, instructions });
      toast.success("Practice set assigned to the student");
      setStudentIdentifier("");
      setTestChapterId("");
      setDueDate("");
      setInstructions("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.response?.data || "Could not assign practice set");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><ClipboardCheck className="h-4 w-4" /></div>
        <div><h3 className="text-sm font-semibold">Assign individual practice</h3><p className="mt-0.5 text-xs text-muted-foreground">Give one student access and add the selected work directly to their routine.</p></div>
      </div>
      {chapters.length ? (
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="assignment-student">Student</Label><Input id="assignment-student" value={studentIdentifier} onChange={(event) => setStudentIdentifier(event.target.value)} placeholder="student@email.com or Clerk user ID" disabled={submitting} /></div>
          <div className="space-y-1.5"><Label>Practice chapter</Label><Select value={testChapterId} onValueChange={setTestChapterId} disabled={submitting}><SelectTrigger><SelectValue placeholder="Select a published chapter" /></SelectTrigger><SelectContent>{chapters.map((chapter) => <SelectItem key={chapter.id} value={chapter.id}>{chapter.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Due date</Label><DatePicker value={dueDate} onChange={setDueDate} minDate={new Date()} placeholder="Select due date" disabled={submitting} /></div>
          <div className="space-y-1.5"><Label htmlFor="assignment-instructions">Instructions <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="assignment-instructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Focus areas or a note for the student" maxLength={500} disabled={submitting} /></div>
          <Button type="submit" className="w-full" disabled={submitting || !studentIdentifier.trim() || !testChapterId || !dueDate}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Assign to student</Button>
        </form>
      ) : <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Publish at least one test chapter before assigning it.</p>}
    </div>
  );
};
