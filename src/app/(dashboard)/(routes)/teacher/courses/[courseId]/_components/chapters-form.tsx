"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FileUp, Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Chapter, Course } from "@prisma/client";
import type { ClientUploadedFileData } from "uploadthing/types";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ChaptersList } from "./chapters-list";
import { UploadDropzone } from "@/lib/uploadthing";

interface ChaptersFormProps {
  initialData: Course & { chapters: Chapter[]};
  courseId: string;
};

const formSchema = z.object({
  title: z.string().min(1),
});

export const ChaptersForm = ({
  initialData,
  courseId
}: ChaptersFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCreating = () => {
    setIsCreating((current) => !current);
    setIsBulkUploading(false);
  }

  const toggleBulkUploading = () => {
    setIsBulkUploading((current) => !current);
    setIsCreating(false);
  }
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
     title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.post(`/api/courses/${courseId}/chapters`, values);
      toast.success("Chapter Created");
      toggleCreating();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  }

  const onBulkUploadComplete = async (files: ClientUploadedFileData<null>[]) => {
    try {
      setIsUpdating(true);
      await axios.post(`/api/courses/${courseId}/chapters/bulk`, {
        files: files.map((file) => ({
          url: file.url,
          name: file.name,
        })),
      });
      toast.success(`${files.length} chapter${files.length === 1 ? "" : "s"} created`);
      setIsBulkUploading(false);
      router.refresh();
    } catch {
      toast.error("Files uploaded, but chapters could not be created");
    } finally {
      setIsUpdating(false);
    }
  }

  const onReorder = async (updateData: { id: string; position: number }[]) => {
    try {
      setIsUpdating(true);
      await axios.put(`/api/courses/${courseId}/chapters/reorder`, {
        list: updateData,
      });
      toast.success("Chapters reordered");
      router.refresh()
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const onEdit = (id: string) =>{
    router.push(`/teacher/courses/${courseId}/chapters/${id}`)
  }
  return (
    <div className="relative w-full mt-6 border bg-slate-100 dark:bg-slate-800 rounded-md p-4">
      {isUpdating && (
        <div className="absolute h-full w-full bg-slate-500/20 top-0 right-0 rounded-m flex items-center justify-center">
          <Loader2 className="animate-spin w-6 h-6 text-sky-700"/>
        </div>
      )}
      <div className="font-medium flex items-center justify-between gap-x-2">
        Course Chapters
        <div className="flex items-center gap-x-2">
          <Button onClick={toggleBulkUploading} variant="ghost">
            {isBulkUploading ? (
              <>Cancel</>
            ) : (
              <>
                <FileUp className="h-4 w-4 mr-2" />
                Bulk upload
              </>
            )}
          </Button>
          <Button onClick={toggleCreating} variant="ghost">
            {isCreating ? (
              <>Cancel</>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add a chapter
              </>
            )}
          </Button>
        </div>
      </div>

      {isCreating && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. 'Introduction about your course'"
                      {...field}
                    />
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
                Create 
              </Button>
            </div>
          </form>
        </Form>
      )}
      {isBulkUploading && (
        <div className="mt-4">
          <UploadDropzone
            endpoint="courseBulkChapterAttachment"
            onClientUploadComplete={(res) => {
              void onBulkUploadComplete(res);
            }}
            onUploadError={(error: Error) => {
              toast.error(`${error?.message}`);
            }}
          />
          <p className="text-xs text-muted-foreground mt-4">
            Upload PDFs, DOCX files, images, audio, video, or text files. Each file creates a chapter named from the file name.
          </p>
        </div>
      )}
      {!isCreating && !isBulkUploading && (
        <div className={cn(
          "text-sm  mt-2",
          !initialData.chapters.length && "text-slate-500 italic"
        )}>
          {!initialData.chapters.length && "No chapters"}
          <ChaptersList
            onEdit={onEdit}
            onReorder = {onReorder}
            items={initialData.chapters || []}
          />
        </div>
      )}
      {!isCreating && !isBulkUploading && (
        <p className="text-xs text-muted-foreground mt-4">
          Drag and drop to reorder the chapters
        </p>
      )}
    </div>
  )
}
