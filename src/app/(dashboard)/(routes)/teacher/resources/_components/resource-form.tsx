"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { FileCheck2, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXAM_TYPES, RESOURCE_CATEGORIES, RESOURCE_TYPES, SCHOOL_BOARDS, SCHOOL_CLASSES } from "@/lib/resource-options";

const currentYear = new Date().getFullYear();

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(2000).optional(),
  url: z.string().url("Upload a PDF document"),
  category: z.string().min(1),
  type: z.string().min(1),
  subject: z.string().trim().min(1, "Subject is required").max(80),
  grade: z.string().optional(),
  year: z.string().optional(),
  schoolName: z.string().trim().max(160).optional(),
  board: z.string().optional(),
  examType: z.string().optional(),
}).superRefine((value, context) => {
  if (value.year && (!/^\d{4}$/.test(value.year) || Number(value.year) < 1990 || Number(value.year) > currentYear)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["year"], message: `Enter a year from 1990 to ${currentYear}` });
  }
  if (value.category !== "SCHOOL") return;
  for (const field of ["schoolName", "board", "grade", "examType", "year"] as const) {
    if (!value[field]) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: "Required for school papers" });
  }
});

type FormValues = z.infer<typeof formSchema>;
type SelectOption = string | { label: string; value: string };

function ResourceSelect({ value, onChange, options, placeholder, disabled }: {
  value?: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <FormControl><SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger></FormControl>
      <SelectContent>
        {options.map(option => {
          const optionValue = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}

export const ResourceForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "", description: "", url: "", category: "SCHOOL", type: "PAST_PAPER",
      subject: "", grade: "", year: "", schoolName: "", board: "", examType: "",
    },
  });
  const isSchoolPaper = form.watch("category") === "SCHOOL";

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      await axios.post("/api/resources", {
        ...values,
        description: values.description || null,
        grade: values.grade || null,
        year: values.year ? Number(values.year) : null,
        schoolName: isSchoolPaper ? values.schoolName : null,
        board: values.board || null,
        examType: isSchoolPaper ? values.examType : null,
        isPaid: false,
      });
      toast.success("Added to Paper Vault");
      form.reset();
      router.refresh();
    } catch (error) {
      const message = axios.isAxiosError(error) && error.response?.data?.message;
      toast.error(message || "Could not add this paper");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div><h2 className="text-base font-semibold">Paper details</h2><p className="mt-1 text-sm text-muted-foreground">Use precise details so students can find it through filters.</p></div>
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Title</FormLabel><FormControl><Input disabled={isSubmitting} placeholder="DPS Class 10 Mathematics Annual 2025" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description <span className="font-normal text-muted-foreground">(optional)</span></FormLabel><FormControl><Textarea disabled={isSubmitting} placeholder="Paper set, language, syllabus, or any useful context" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem><FormLabel>Collection</FormLabel><ResourceSelect {...field} options={RESOURCE_CATEGORIES} placeholder="Select collection" disabled={isSubmitting} /><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem><FormLabel>Document type</FormLabel><ResourceSelect {...field} options={RESOURCE_TYPES} placeholder="Select type" disabled={isSubmitting} /><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <div><h2 className="text-base font-semibold">Search metadata</h2><p className="mt-1 text-sm text-muted-foreground">These values become filters in the student library.</p></div>
          {isSchoolPaper && <FormField control={form.control} name="schoolName" render={({ field }) => (
            <FormItem><FormLabel>School name</FormLabel><FormControl><Input disabled={isSubmitting} placeholder="e.g. St. Xavier's Collegiate School" {...field} /></FormControl><FormMessage /></FormItem>
          )} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="board" render={({ field }) => (
              <FormItem><FormLabel>Board {!isSchoolPaper && <span className="font-normal text-muted-foreground">(optional)</span>}</FormLabel><ResourceSelect {...field} options={SCHOOL_BOARDS} placeholder="Select board" disabled={isSubmitting} /><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="grade" render={({ field }) => (
              <FormItem><FormLabel>Class {!isSchoolPaper && <span className="font-normal text-muted-foreground">(optional)</span>}</FormLabel><ResourceSelect {...field} options={SCHOOL_CLASSES} placeholder="Select class" disabled={isSubmitting} /><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem><FormLabel>Subject</FormLabel><FormControl><Input disabled={isSubmitting} placeholder="e.g. Mathematics" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="year" render={({ field }) => (
              <FormItem><FormLabel>Paper year</FormLabel><FormControl><Input inputMode="numeric" disabled={isSubmitting} placeholder={String(currentYear)} maxLength={4} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {isSchoolPaper && <FormField control={form.control} name="examType" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>Exam</FormLabel><ResourceSelect {...field} options={EXAM_TYPES} placeholder="Select exam" disabled={isSubmitting} /><FormMessage /></FormItem>
            )} />}
          </div>
        </div>

        <div className="space-y-3 border-t pt-6">
          <div><h2 className="text-base font-semibold">PDF file</h2><p className="mt-1 text-sm text-muted-foreground">Upload a clear, readable paper.</p></div>
          <FormField control={form.control} name="url" render={({ field }) => (
            <FormItem><FormControl>{!field.value ? (
              <div className="rounded-md border border-dashed p-4"><FileUpload endpoint="courseAttachment" onChange={url => url && field.onChange(url)} /></div>
            ) : (
              <div className="flex min-w-0 items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                <FileCheck2 className="h-5 w-5 shrink-0" /><span className="min-w-0 flex-1 truncate text-sm">PDF ready</span><Button type="button" onClick={() => field.onChange("")} variant="ghost" size="sm">Remove</Button>
              </div>
            )}</FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <Button disabled={isSubmitting} type="submit" className="w-full sm:w-auto">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Add to Paper Vault
        </Button>
      </form>
    </Form>
  );
};
