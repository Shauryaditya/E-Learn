
"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  grade: z.string().min(1, "Grade is required"),
  board: z.string().min(1, "Board is required"),
  subjects: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one subject.",
  }),
  targetExam: z.string().optional(),
});

const GRADES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE"];
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Computer Science",
  "History",
  "Geography",
  "Accountancy",
  "Economics",
  "Business Studies",
];

interface StudentOnboardingModalProps {
  isOpen: boolean;
}

export const StudentOnboardingModal = ({
  isOpen
}: StudentOnboardingModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // If isOpen is true, we force it open and prevent closing
  // logic inside Dialog: onOpenChange={() => {}} (empty function prevents closing via outside click/escape if configured right, 
  // but better to manage 'open' state here if needed. 
  // Actually standard Dialog closes on outside click. We can prevent that in onOpenChange.

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: "",
      board: "",
      subjects: [],
      targetExam: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      await axios.post("/api/student/profile", values);
      toast.success("Profile updated!");
      router.refresh();
      // We rely on the parent to close the modal by updating isOpen (or re-rendering parent which will fetch updated profile and pass isOpen=false)
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Let&apos;s setup your profile.</DialogTitle>
          <DialogDescription>
            Tell us a bit about yourself so we can personalize your learning experience.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Grade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Grade" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                            {grade}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="board"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Board</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Board" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {BOARDS.map((board) => (
                            <SelectItem key={board} value={board}>
                            {board}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="subjects"
              render={() => (
                <FormItem>
                  <FormLabel className="mb-4">Subjects (Select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {SUBJECTS.map((subject) => (
                      <FormField
                        key={subject}
                        control={form.control}
                        name="subjects"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={subject}
                              className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-2"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(subject)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, subject])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== subject
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal cursor-pointer w-full">
                                {subject}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
                control={form.control}
                name="targetExam"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Target Exam (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. JEE, NEET, Boards" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Profile
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
