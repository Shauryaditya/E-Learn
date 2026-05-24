"use client";

import * as z from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  startsAt: z.string().min(1, "Start time is required"),
  durationMinutes: z.coerce.number().min(1, "Duration is required"),
  registrationOpensAt: z.string().optional().nullable(),
  registrationClosesAt: z.string().optional().nullable(),
  maxParticipants: z.coerce.number().optional().nullable(),
});

const toDateTimeLocal = (date?: Date | null) => {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

interface ContestDetailsFormProps {
  contestId: string;
  initialData: {
    title: string;
    description: string | null;
    imageUrl: string | null;
    price: number | null;
    startsAt: Date;
    durationMinutes: number;
    registrationOpensAt: Date | null;
    registrationClosesAt: Date | null;
    maxParticipants: number | null;
    categoryId: string | null;
  };
  categories: { label: string; value: string }[];
}

export const ContestDetailsForm = ({
  contestId,
  initialData,
  categories,
}: ContestDetailsFormProps) => {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      description: initialData.description || "",
      imageUrl: initialData.imageUrl || "",
      price: initialData.price,
      categoryId: initialData.categoryId || "",
      startsAt: toDateTimeLocal(initialData.startsAt),
      durationMinutes: initialData.durationMinutes,
      registrationOpensAt: toDateTimeLocal(initialData.registrationOpensAt),
      registrationClosesAt: toDateTimeLocal(initialData.registrationClosesAt),
      maxParticipants: initialData.maxParticipants,
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/contests/${contestId}`, {
        ...values,
        price: values.price || null,
        maxParticipants: values.maxParticipants || null,
      });
      toast.success("Contest updated");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="rounded-md border bg-slate-50 p-4 dark:bg-slate-900">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={isSubmitting}
                    placeholder="What is this contest about?"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    min={0}
                    placeholder="0 for free"
                    type="number"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts at</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration minutes</FormLabel>
                  <FormControl>
                    <Input disabled={isSubmitting} min={1} type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="registrationOpensAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration opens</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      type="datetime-local"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationClosesAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration closes</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      type="datetime-local"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max participants</FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    min={1}
                    placeholder="No limit"
                    type="number"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={!isValid || isSubmitting} type="submit">
            Save
          </Button>
        </form>
      </Form>
    </div>
  );
};
