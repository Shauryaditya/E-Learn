
"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, PlusCircle, FileText } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/file-upload";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
  url: z.string().min(1, {
     message: "File is required",
  }),
  category: z.string().min(1),
  type: z.string().min(1),
  subject: z.string().min(1),
  grade: z.string().optional(),
  year: z.coerce.number().optional(),
  isPaid: z.boolean().default(false),
});

const CATEGORIES = [
    { label: "Board Exam", value: "BOARD" },
    { label: "JEE Mains", value: "JEE_MAINS" },
    { label: "JEE Advanced", value: "JEE_ADVANCED" },
    { label: "NEET", value: "NEET" },
    { label: "Other", value: "OTHER" },
];

const TYPES = [
    { label: "Past Paper", value: "PAST_PAPER" },
    { label: "Sample Paper", value: "SAMPLE_PAPER" },
    { label: "Notes", value: "NOTES" },
];

export const ResourceForm = () => {
  const router = useRouter();
  const [issubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      category: "BOARD",
      type: "PAST_PAPER",
      subject: "",
      isPaid: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await axios.post("/api/resources", values);
      toast.success("Resource created");
      form.reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                    <Input disabled={issubmitting} placeholder="e.g. 'JEE Mains 2023 Physics'" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                        <Input disabled={issubmitting} placeholder="e.g. Physics" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                 <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Year (Optional)</FormLabel>
                    <FormControl>
                        <Input type="number" disabled={issubmitting} placeholder="e.g. 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Grade (Optional)</FormLabel>
                    <FormControl>
                        <Input disabled={issubmitting} placeholder="e.g. Class 12" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF Document</FormLabel>
                  <FormControl>
                    {!field.value ? (
                        <FileUpload
                            endpoint="courseAttachment"
                            onChange={(url) => {
                                if (url) {
                                  field.onChange(url);
                                }
                            }}
                        />
                    ) : (
                         <div className="flex items-center p-2 bg-sky-100 border-sky-200 border rounded-md text-sky-700">
                             <FileText className="h-4 w-4 mr-2" />
                             <span className="text-xs truncate max-w-[200px]">{field.value}</span>
                             <Button onClick={() => field.onChange("")} variant="ghost" size="sm" className="ml-auto text-xs">Remove</Button>
                         </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-x-2">
                <Button disabled={issubmitting} type="submit">
                    {issubmitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
                    Create Resource
                </Button>
            </div>
        </form>
        </Form>
    </div>
  )
}
