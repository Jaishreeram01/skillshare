import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Video, FileText, CheckCircle, AlertCircle, Upload, Github, X } from "lucide-react";
import Calendar from "@/components/Calendar";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";

export default function Sessions() {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState("upcoming");
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const { user, refreshProfile } = useAuth();
    const { refreshUser } = useUser();
    const [sessions, setSessions] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [newLink, setNewLink] = useState("");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "tasks") {
            setActiveTab("tasks");
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            const [sessionsRes, tasksRes] = await Promise.all([
                api.get("/sessions/"),
                api.get("/tasks/")
            ]);
            setSessions(sessionsRes.data);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateLink = async () => {
        if (!selectedSession) return;
        try {
            await api.put(`/sessions/${selectedSession.id}`, { meetLink: newLink });
            setShowLinkModal(false);
            fetchData();
        } catch (error) {
            console.error("Failed to update link", error);
        }
    };

    const handleCompleteSession = async (sessionId: string) => {
        try {
            await api.put(`/sessions/${sessionId}`, { status: "COMPLETED" });
            fetchData();
            await Promise.all([refreshProfile(), refreshUser()]); // Refresh stats immediately
        } catch (error) {
            console.error("Failed to complete session", error);
        }
    };

    // OPTIMIZATION: Memoize filtered sessions to prevent recalculation on every render
    const filteredSessions = useMemo(() => {
        const now = new Date();
        if (activeTab === "upcoming") {
            return sessions.filter(s =>
                s.status === "SCHEDULED" && new Date(s.scheduledAt) >= now
            ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        } else if (activeTab === "past") {
            return sessions.filter(s =>
                s.status === "COMPLETED" || new Date(s.scheduledAt) < now
            ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        }
        return sessions;
    }, [sessions, activeTab]);

    // OPTIMIZATION: Memoize pending tasks
    // const pendingTasks = useMemo(() => {
    //     return tasks.filter(t => t.status === "PENDING");
    // }, [tasks]);

    return (
        <div className="space-y-8 animate-fade-in font-handwritten">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight -rotate-1">My Sessions 📅</h1>
                    <p className="text-muted-foreground mt-1 font-bold">Manage your teaching and learning schedule.</p>
                </div>
                <div className="flex space-x-2 bg-transparent p-1">
                    <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`px-4 py-2 rounded-lg text-lg font-bold transition-all border-2 border-border ${activeTab === "upcoming" ? "bg-yellow-300 text-black shadow-[2px_2px_0px_0px_var(--sketch-shadow)] -translate-y-1" : "bg-card text-muted-foreground hover:bg-muted"}`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab("past")}
                        className={`px-4 py-2 rounded-lg text-lg font-bold transition-all border-2 border-border ${activeTab === "past" ? "bg-yellow-300 text-black shadow-[2px_2px_0px_0px_var(--sketch-shadow)] -translate-y-1" : "bg-card text-muted-foreground hover:bg-muted"}`}
                    >
                        Past History
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`px-4 py-2 rounded-lg text-lg font-bold transition-all border-2 border-border ${activeTab === "tasks" ? "bg-yellow-300 text-black shadow-[2px_2px_0px_0px_var(--sketch-shadow)] -translate-y-1" : "bg-card text-muted-foreground hover:bg-muted"}`}
                    >
                        Assigned Tasks
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Widget */}
                <div className="lg:col-span-1">
                    <Calendar sessions={sessions} onDateClick={(date, daySessions) => {
                        // Optional: Could add functionality to filter sessions by selected date
                        console.log('Selected date:', date, 'Sessions:', daySessions);
                    }} />
                </div>

                {/* Sessions List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading && <div className="text-center p-8 bg-card border-2 border-border border-dashed rounded-xl">Loading...</div>}

                    {!loading && activeTab !== "tasks" && (
                        <>
                            {filteredSessions.length === 0 ? (
                                <div className="text-center p-8 bg-card border-2 border-border border-dashed rounded-xl">
                                    <p className="text-muted-foreground font-bold">No sessions found.</p>
                                </div>
                            ) : (
                                filteredSessions.map((session, i) => (
                                    <div key={session.id} className={`bg-card rounded-xl border-2 border-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:translate-x-1 transition-transform shadow-[4px_4px_0px_0px_var(--sketch-shadow)] ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                                        {/* Tape Effect */}
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-yellow-100/80 border border-border transform -rotate-2" />

                                        <div className="flex items-center space-x-4 w-full md:w-auto">
                                            <div className="relative">
                                                <img src={session.partnerAvatar || "https://i.pravatar.cc/150"} className="w-16 h-16 rounded-full object-cover border-2 border-border bg-muted" />
                                                <div className="absolute -bottom-1 -right-2 bg-card px-2 py-0.5 rounded-none text-[10px] font-black border-2 border-border uppercase tracking-wide rotate-3 shadow-[1px_1px_0px_0px_var(--sketch-shadow)] text-foreground">
                                                    {session.role || "Participant"}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-foreground">{session.topic}</h3>
                                                <p className="text-muted-foreground flex items-center mt-1 font-bold font-sans text-sm">
                                                    <Clock className="w-4 h-4 mr-1" /> {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : session.date} • {session.duration || 60} min
                                                </p>
                                                <p className="text-sm font-bold mt-1 text-muted-foreground">with {session.partnerName || "Unknown"}</p>
                                            </div>
                                        </div>

                                        {session.status === "SCHEDULED" || session.status === "upcoming" ? (
                                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                                <div className="flex items-center justify-center md:justify-end text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-sm font-black border-2 border-border px-3 py-1 rounded-full mb-2 transform -rotate-2">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-2 border-border hover:bg-muted font-bold"
                                                        onClick={() => {
                                                            setSelectedSession(session);
                                                            setNewLink(session.meetLink || "");
                                                            setShowLinkModal(true);
                                                        }}
                                                    >
                                                        {session.meetLink ? "Edit Link" : "Add Link"}
                                                    </Button>

                                                    {(user?.uid === session.teacherId || user?.uid === session.learnerId) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold"
                                                            onClick={() => handleCompleteSession(session.id)}
                                                        >
                                                            Mark Done
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        disabled={!session.meetLink}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)] font-bold disabled:opacity-50"
                                                        onClick={() => session.meetLink && window.open(session.meetLink, '_blank')}
                                                    >
                                                        <Video className="w-4 h-4 mr-2" /> Join Meet
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 w-full md:w-auto text-right">
                                                <span className="text-sm text-muted-foreground font-bold">Completed</span>
                                                <div className="flex gap-1 justify-end">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <div key={star} className="w-5 h-5 bg-yellow-400 rounded-sm border-2 border-border" />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                            {/* AI Suggestion - Sticky Note Style */}
                            <div className="bg-yellow-100 border-2 border-border rounded-none p-6 flex items-start gap-4 shadow-[4px_4px_0px_0px_var(--sketch-shadow)] rotate-1 relative">
                                <div className="absolute -top-4 right-10 w-8 h-8 rounded-full bg-red-500 border-2 border-border" /> {/* Magnet/Pin */}

                                <div className="p-2 bg-white border-2 border-border rounded-lg">
                                    <AlertCircle className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg text-black">AI Session Prep 🤖</h4>
                                    <p className="text-sm text-slate-800 mt-1 font-bold font-handwritten text-lg leading-tight">Your session is upcoming. The AI has generated a tailored agenda.</p>
                                    <Button variant="link" className="p-0 h-auto mt-2 text-blue-700 font-bold underline decoration-2">View Agenda</Button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Assigned Tasks Section */}
                    {!loading && activeTab === "tasks" && (
                        <>
                            {tasks.length === 0 ? (
                                <div className="text-center p-8 bg-card border-2 border-border border-dashed rounded-xl">
                                    <p className="text-muted-foreground font-bold">No tasks assigned.</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div key={task.id} className="bg-card rounded-xl border-2 border-border p-6 shadow-[4px_4px_0px_0px_var(--sketch-shadow)] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 border-l-2 border-b-2 border-border rounded-bl-3xl flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-yellow-600 opacity-50" />
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <img src={task.assignedByAvatar || "https://i.pravatar.cc/150"} className="w-10 h-10 rounded-full border-2 border-border bg-muted" />
                                                <div>
                                                    <h4 className="font-bold text-lg leading-tight">{task.title}</h4>
                                                    <p className="text-sm text-muted-foreground font-sans font-bold flex items-center mt-1">
                                                        Assigned by {task.assignedBy} • <Clock className="w-3 h-3 mx-1" /> Due {task.dueDate}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {task.status === "COMPLETED" ? (
                                                    <span className="flex items-center text-green-600 font-black text-sm bg-green-100 px-3 py-1 rounded-full border-2 border-green-200">
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="font-bold border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)] active:translate-y-[2px] active:shadow-none transition-all"
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setShowTaskModal(true);
                                                        }}
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" /> Submit Work
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Task Submission Modal */}
            {showTaskModal && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-background w-full max-w-lg rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full hover:bg-muted"
                            onClick={() => {
                                setShowTaskModal(false);
                                setSelectedTask(null);
                            }}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <h2 className="text-2xl font-black mb-1">Submit Task</h2>
                        <p className="text-muted-foreground font-bold text-sm mb-6">Upload your work for "{selectedTask.title}"</p>

                        <div className="space-y-6">
                            {/* File Upload Zone */}
                            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg">Upload Project Files</h3>
                                <p className="text-sm text-muted-foreground font-sans mt-1">Drag & drop your .zip file here</p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t-2 border-dashed border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground font-bold">Or submit via link</span>
                                </div>
                            </div>

                            {/* GitHub Link Input */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider mb-2 block">GitHub Repository URL</label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="https://github.com/username/repo"
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-muted/30 font-sans focus:outline-none focus:border-foreground transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 font-bold border-2 border-border"
                                    onClick={() => setShowTaskModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 font-bold bg-green-600 hover:bg-green-700 text-white shadow-[4px_4px_0px_0px_var(--sketch-shadow)] active:translate-y-[2px] active:shadow-none transition-all"
                                    onClick={() => {
                                        // Handle submission logic here
                                        setShowTaskModal(false);
                                    }}
                                >
                                    Submit Assignment
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Link Modal */}
            {showLinkModal && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-background w-full max-w-sm rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full hover:bg-muted"
                            onClick={() => setShowLinkModal(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                            <Video className="w-6 h-6 text-blue-600" />
                            Meeting Link
                        </h2>
                        <p className="text-muted-foreground font-bold text-sm mb-6">Enter Zoom, Meet or Discord link.</p>

                        <div className="space-y-4 font-sans">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Meeting URL</label>
                                <Input
                                    placeholder="https://zoom.us/j/..."
                                    value={newLink}
                                    onChange={(e) => setNewLink(e.target.value)}
                                    className="border-2 border-border font-sans font-bold py-6 text-lg"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 font-bold border-2 border-border"
                                    onClick={() => setShowLinkModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-[4px_4px_0px_0px_var(--sketch-shadow)] active:translate-y-[2px] active:shadow-none transition-all"
                                    onClick={handleUpdateLink}
                                >
                                    Save Link
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
