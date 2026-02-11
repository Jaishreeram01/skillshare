import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarSession {
    id: string;
    title: string;
    scheduledAt: string;
    partnerName: string;
    partnerAvatar?: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    role: 'teacher' | 'learner';
}

interface CalendarProps {
    sessions: CalendarSession[];
    onDateClick?: (date: Date, sessions: CalendarSession[]) => void;
}

export default function Calendar({ sessions, onDateClick }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Get first day of month and total days
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Group sessions by date
    const sessionsByDate: { [key: string]: CalendarSession[] } = {};
    sessions.forEach(session => {
        const date = new Date(session.scheduledAt);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (!sessionsByDate[dateKey]) {
            sessionsByDate[dateKey] = [];
        }
        sessionsByDate[dateKey].push(session);
    });

    // Navigation functions
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if date is today
    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
    };

    // Check if date is selected
    const isSelected = (day: number) => {
        if (!selectedDate) return false;
        return day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();
    };

    // Get sessions for a specific day
    const getSessionsForDay = (day: number) => {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return sessionsByDate[dateKey] || [];
    };

    // Handle date click
    const handleDateClick = (day: number) => {
        const date = new Date(year, month, day);
        setSelectedDate(date);
        const daySessions = getSessionsForDay(day);
        if (onDateClick) {
            onDateClick(date, daySessions);
        }
    };

    // Generate calendar days
    const calendarDays = [];

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="h-20" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const daySessions = getSessionsForDay(day);
        const hasScheduled = daySessions.some(s => s.status === 'SCHEDULED');
        const hasCompleted = daySessions.some(s => s.status === 'COMPLETED');
        const hasCancelled = daySessions.some(s => s.status === 'CANCELLED');

        calendarDays.push(
            <button
                key={day}
                onClick={() => handleDateClick(day)}
                className={cn(
                    "h-20 border-2 border-border rounded-lg p-2 transition-all hover:scale-105 hover:shadow-[2px_2px_0px_0px_var(--sketch-shadow)] font-handwritten relative",
                    isToday(day) && "bg-yellow-200 border-yellow-500 font-black",
                    isSelected(day) && "bg-blue-100 border-blue-500 ring-2 ring-blue-300",
                    !isToday(day) && !isSelected(day) && "bg-card hover:bg-muted"
                )}
            >
                <span className="text-lg font-bold">{day}</span>

                {/* Session indicators */}
                {daySessions.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                        {hasScheduled && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        {hasCompleted && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        {hasCancelled && <div className="w-2 h-2 rounded-full bg-red-500" />}
                    </div>
                )}

                {/* Session count badge */}
                {daySessions.length > 0 && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-sans font-bold">
                        {daySessions.length}
                    </div>
                )}
            </button>
        );
    }

    return (
        <div className="sketch-card p-6 border-border bg-card rotate-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6" />
                    Calendar
                </h2>
                <Button
                    onClick={goToToday}
                    variant="outline"
                    size="sm"
                    className="sketch-button border-border"
                >
                    Today
                </Button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    onClick={goToPreviousMonth}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                <h3 className="text-xl font-black">
                    {monthNames[month]} {year}
                </h3>

                <Button
                    onClick={goToNextMonth}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-muted"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-bold text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {calendarDays}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-sm font-sans">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Cancelled</span>
                </div>
            </div>
        </div>
    );
}
