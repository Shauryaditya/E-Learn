"use client";

import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { File, Loader2, X } from "lucide-react";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";

interface TestSubmissionFormProps {
    testSeriesId: string;
    testChapterId: string;
}

const formSchema = z.object({
    pdfUrl: z.string().min(1, {
        message: "PDF is required",
    }),
});

export const TestSubmissionForm = ({
    testSeriesId,
    testChapterId,
}: TestSubmissionFormProps) => {
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            pdfUrl: "",
        },
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await axios.post(
                `/api/testseries/${testSeriesId}/testChapter/${testChapterId}/submission`,
                values
            );
            toast.success("Test submitted successfully");
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Test Submission
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                        control={form.control}
                        name="pdfUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div>
                                        {field.value ? (
                                            <div className="relative flex items-center p-2 mt-2 rounded-md bg-sky-100/50">
                                                <File className="h-10 w-10 fill-sky-200 stroke-sky-400" />
                                                <a
                                                    href={field.value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-2 text-sm text-sky-700 hover:underline line-clamp-1"
                                                >
                                                    {field.value}
                                                </a>
                                                <button
                                                    onClick={() => field.onChange("")}
                                                    className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
                                                    type="button"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <FileUpload
                                                endpoint="testSubmission"
                                                onChange={(url) => {
                                                    if (url) {
                                                        field.onChange(url);
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex items-center gap-x-2">
                        <Button
                            disabled={!isValid || isSubmitting}
                            type="submit"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : "Submit Test"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};
