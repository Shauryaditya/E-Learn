"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarClock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

const parseLocalDateTime = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toLocalDateTime = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export interface DateTimePickerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onChange"> {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  clearable?: boolean;
}

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(({
  value,
  onChange,
  placeholder = "Pick date and time",
  minDate,
  clearable = false,
  className,
  disabled,
  ...buttonProps
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const selected = parseLocalDateTime(value);
  const displayHour = selected ? String(selected.getHours() % 12 || 12) : "9";
  const displayMinute = selected ? String(Math.floor(selected.getMinutes() / 5) * 5).padStart(2, "0") : "00";
  const period = selected && selected.getHours() >= 12 ? "PM" : "AM";

  const emit = (date: Date) => onChange(toLocalDateTime(date));
  const baseDate = () => selected ? new Date(selected) : new Date(new Date().setHours(9, 0, 0, 0));

  const setTime = (hour: string, minute: string, meridiem: string) => {
    const date = baseDate();
    const hour24 = (Number(hour) % 12) + (meridiem === "PM" ? 12 : 0);
    date.setHours(hour24, Number(minute), 0, 0);
    emit(date);
  };

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
            <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
            {selected ? format(selected, "PPP 'at' p") : placeholder}
          </Button>
        </PopoverTrigger>
        {clearable && selected && !disabled && (
          <button
            type="button"
            aria-label="Clear date and time"
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
            const current = baseDate();
            date.setHours(current.getHours(), current.getMinutes(), 0, 0);
            emit(date);
          }}
          disabled={(date) => Boolean(minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()))}
          initialFocus
        />
        <div className="border-t p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Time</p>
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
            <Select disabled={!selected} value={displayHour} onValueChange={(hour) => setTime(hour, displayMinute, period)}>
              <SelectTrigger aria-label="Hour"><SelectValue /></SelectTrigger>
              <SelectContent>{HOURS.map((hour) => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}</SelectContent>
            </Select>
            <Select disabled={!selected} value={displayMinute} onValueChange={(minute) => setTime(displayHour, minute, period)}>
              <SelectTrigger aria-label="Minute"><SelectValue /></SelectTrigger>
              <SelectContent>{MINUTES.map((minute) => <SelectItem key={minute} value={minute}>{minute}</SelectItem>)}</SelectContent>
            </Select>
            <Select disabled={!selected} value={period} onValueChange={(nextPeriod) => setTime(displayHour, displayMinute, nextPeriod)}>
              <SelectTrigger aria-label="AM or PM"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" className="mt-3 w-full" onClick={() => setOpen(false)} disabled={!selected}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

DateTimePicker.displayName = "DateTimePicker";
