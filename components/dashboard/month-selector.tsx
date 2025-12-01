"use client";

import * as React from "react";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface MonthSelectorProps {
    currentMonth: Date;
    onMonthChange: (date: Date) => void;
    className?: string;
}

export function MonthSelector({
    currentMonth,
    onMonthChange,
    className,
}: MonthSelectorProps) {
    const [open, setOpen] = React.useState(false);

    const handlePreviousMonth = () => {
        onMonthChange(startOfMonth(subMonths(currentMonth, 1)));
    };

    const handleNextMonth = () => {
        onMonthChange(startOfMonth(addMonths(currentMonth, 1)));
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                title="Previous month"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !currentMonth && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {currentMonth ? format(currentMonth, "MMMM yyyy") : <span>Pick a month</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={currentMonth}
                        onSelect={(date) => {
                            if (date) {
                                onMonthChange(startOfMonth(date));
                                setOpen(false);
                            }
                        }}
                        initialFocus
                        defaultMonth={currentMonth}
                    />
                </PopoverContent>
            </Popover>
            <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                title="Next month"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
