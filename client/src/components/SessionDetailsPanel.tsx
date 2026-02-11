import { Clock, Video, Calendar } from "lucide-react";
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
    meetLink?: string;
    topic?: string;
}

interface SessionDetailsPanelProps {
    selectedDate: Date | null;
    sessions: CalendarSession[];
}

export default function SessionDetailsPanel({ selectedDate, sessions }: SessionDetailsPanelProps) {
    if (!selectedDate) {
        return (
            <div className="sketch-card p-6 border-border bg-card -rotate-1">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Sessions
                </h3>
                <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-sans">Click a date to view sessions</p>
                </div>
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
                return '🟢';
            case 'COMPLETED':
                return '🔵';
            case 'CANCELLED':
                return '🔴';
            default:
                return '⚪';
        }
    };

    return (
        <div className="sketch-card p-6 border-border bg-card -rotate-1">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sessions
            </h3>
            <p className="text-sm text-muted-foreground font-sans mb-4">
                {formatDate(selectedDate)}
            </p>

            {sessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-sans">No sessions scheduled</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="border-2 border-border rounded-lg p-4 bg-background hover:shadow-[2px_2px_0px_0px_var(--sketch-shadow)] transition-all"
                        >
                            {/* Status badge */}
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded border-2 font-sans",
                                    getStatusColor(session.status)
                                )}>
                                    {getStatusIcon(session.status)} {session.status}
                                </span>
                                <span className="text-xs font-bold text-muted-foreground font-sans">
                                    {session.role === 'teacher' ? '👨‍🏫 Teaching' : '👨‍🎓 Learning'}
                                </span>
                            </div>

                            {/* Time */}
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="font-bold">{formatTime(session.scheduledAt)}</span>
                            </div>

                            {/* Topic */}
                            <div className="font-black text-lg mb-2">
                                {session.topic || session.title}
                            </div>

                            {/* Partner */}
                            <div className="flex items-center gap-2 mb-3">
                                {session.partnerAvatar ? (
                                    <img
                                        src={session.partnerAvatar}
                                        alt={session.partnerName}
                                        className="w-6 h-6 rounded-full border border-border"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">
                                        {session.partnerName?.charAt(0) || '?'}
                                    </div>
                                )}
                                <span className="text-sm font-sans">
                                    with <span className="font-bold">{session.partnerName}</span>
                                </span>
                            </div>

                            {/* Actions */}
                            {session.status === 'SCHEDULED' && (
                                <div className="flex gap-2">
                                    {session.meetLink && (
                                        <Button
                                            size="sm"
                                            className="sketch-button bg-green-500 text-white hover:bg-green-600 border-green-700"
                                            onClick={() => window.open(session.meetLink, '_blank')}
                                        >
                                            <Video className="w-4 h-4 mr-1" />
                                            Join Meeting
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="sketch-button border-border"
                                    >
                                        Reschedule
                                    </Button>
                                </div>
                            )}

                            {session.status === 'COMPLETED' && (
                                <div className="text-sm text-muted-foreground font-sans italic">
                                    ✅ Session completed
                                </div>
                            )}

                            {session.status === 'CANCELLED' && (
                                <div className="text-sm text-red-600 font-sans italic">
                                    ❌ Session cancelled
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
