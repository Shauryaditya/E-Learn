"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const parseDateOnly = (value?: string | null) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toDateOnly = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export interface DatePickerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onChange"> {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  clearable = false,
  className,
  disabled,
  ...buttonProps
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const selected = parseDateOnly(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-start rounded-md border-input bg-background px-3 text-left text-sm font-normal",
              !selected && "text-muted-foreground",
              clearable && selected && "pr-10",
              className
            )}
            {...buttonProps}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {selected ? format(selected, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        {clearable && selected && !disabled && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(event) => { event.stopPropagation(); onChange(""); }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-auto rounded-xl p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected || minDate || new Date()}
          onSelect={(date) => {
            if (!date) return;
            onChange(toDateOnly(date));
            setOpen(false);
          }}
          disabled={(date) => Boolean((minDate && date < minDate) || (maxDate && date > maxDate))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});

DatePicker.displayName = "DatePicker";
