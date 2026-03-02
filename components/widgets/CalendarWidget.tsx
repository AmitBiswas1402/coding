"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
  submissionsByDay?: { date: string; count: number }[];
}

export function CalendarWidget({ submissionsByDay = [] }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} left`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const submissionMap = new Map(
    submissionsByDay.map((s) => [s.date, s.count])
  );

  const hasSubmission = (date: Date) => {
    const dateStr = date.toISOString().slice(0, 10);
    return submissionMap.has(dateStr) && submissionMap.get(dateStr)! > 0;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3">
        <div className="text-xs text-muted-foreground mb-1">Day {today.getDate()}</div>
        <div className="text-xs font-medium">{timeRemaining}</div>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {monthNames[month]} {year}
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {weekDays.map((day) => (
          <div key={day} className="p-1 text-center text-muted-foreground font-medium">
            {day}
          </div>
        ))}
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="p-1" />;
          }
          const dateStr = date.toISOString().slice(0, 10);
          const submitted = hasSubmission(date);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={dateStr}
              className={cn(
                "p-1 text-center rounded transition-colors",
                isCurrentDay && "bg-primary text-primary-foreground font-medium",
                !isCurrentDay && submitted && "bg-green-500/20 text-green-400",
                !isCurrentDay && !submitted && "hover:bg-muted"
              )}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
