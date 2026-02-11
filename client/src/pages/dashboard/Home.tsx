import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Users, Flame, Trophy, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import MentorProfileModal from "@/components/MentorProfileModal";
import Calendar from "@/components/Calendar";
import SessionDetailsPanel from "@/components/SessionDetailsPanel";
import api from "@/services/api";
import { useUser } from "@/contexts/UserContext";

export default function DashboardHome() {
    const [mentors, setMentors] = useState<any[]>([]);
    const { user } = useUser(); // Use shared user context
    const [selectedMentor, setSelectedMentor] = useState<any>(null);
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedDateSessions, setSelectedDateSessions] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Sessions
                const sessionsRes = await api.get('/sessions');
                setSessions(sessionsRes.data);

                const { data } = await api.get('/matches/suggestions');
                // Map backend User to frontend Mentor format
                const formatted = data.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
                    role: u.headline || "Learner",
                    match: u.trustScore, // mapped from backend hack
                    teaches: u.skills || [],
                    wants: u.learning || [],
                    bio: u.bio || "No bio yet.",
                    experience: u.experienceLevel || "Beginner",
                    availability: u.availability || "Flexible"
                }));
                setMentors(formatted);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    // OPTIMIZATION: Memoize sorted mentors to prevent re-sorting on every render
    // const sortedMentors = useMemo(() => {
    //     return [...mentors].sort((a, b) => (b.match || 0) - (a.match || 0));
    // }, [mentors]);


    const handleMentorClick = (mentor: any) => {
        setSelectedMentor(mentor);
        setShowMentorModal(true);
    };

    const handleDateClick = (date: Date, daySessions: any[]) => {
        setSelectedDate(date);
        setSelectedDateSessions(daySessions);
    };

    return (
        <div className="space-y-8 font-handwritten">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                <div>
                    <h1 className="text-4xl font-bold text-foreground tracking-tight -rotate-1">
                        Hey {user?.name?.split(' ')[0] || "there"}! <span className="text-3xl">✏️</span>
                    </h1>
                    <p className="text-muted-foreground font-sans font-medium mt-1">Ready to create something today?</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-card border-2 border-border shadow-[3px_3px_0px_0px_var(--sketch-shadow)] px-4 py-2 rounded-lg font-bold flex items-center transform rotate-1">
                        <Flame className="w-5 h-5 mr-2 text-orange-500 fill-orange-500" /> {user?.streak || 0} Day Streak
                    </div>
                    <Link to="/dashboard/Matches">
                        <Button className="sketch-button bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                            <Sparkles className="w-4 h-4 mr-2" /> Start Session
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Sticky Notes Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {[
                    { label: "Total XP", value: user?.xp || 0, icon: Trophy, color: "bg-yellow-200 text-black", rotate: "-rotate-2" },
                    { label: "Sessions", value: user?.sessions || 0, icon: Users, color: "bg-blue-200 text-black", rotate: "rotate-1" },
                    { label: "Hours", value: user?.totalHours || 0, icon: Clock, color: "bg-green-200 text-black", rotate: "-rotate-1" },
                    { label: "Level", value: `Lvl ${user?.level || 1}`, icon: Target, color: "bg-purple-200 text-black", rotate: "rotate-2" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-6 rounded-none shadow-[4px_4px_0px_0px_var(--sketch-shadow)] border-2 border-border flex flex-col justify-between h-32 ${stat.color} ${stat.rotate} hover:rotate-0 transition-transform cursor-pointer`}
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)" }}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-3xl font-black">{stat.value}</h3>
                            <stat.icon className="w-6 h-6 opacity-70" />
                        </div>
                        <p className="font-bold opacity-70 uppercase tracking-widest text-xs">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Calendar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Calendar sessions={sessions} onDateClick={handleDateClick} />
                </div>
                <div>
                    <SessionDetailsPanel
                        selectedDate={selectedDate}
                        sessions={selectedDateSessions}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Notebook Section: Matches */}
                <div className="lg:col-span-2 sketch-card p-8 bg-card relative overflow-hidden text-foreground">
                    {/* Notebook binding mimic */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-transparent border-b-2 border-dashed border-border" />
                    <div className="absolute left-6 top-0 bottom-0 w-px border-l-2 border-pink-300 dark:border-pink-900 h-full" />

                    <div className="flex items-center justify-between mb-6 pl-8">
                        <h2 className="text-2xl font-bold flex items-center">
                            <Users className="w-6 h-6 mr-2" /> Suggested Study Buddies
                        </h2>
                        <Button variant="link" className="text-primary font-bold underline decoration-wavy">See All</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                        {mentors.map((mentor, i) => (
                            <div
                                key={i}
                                className="border-2 border-border rounded-xl p-4 hover:border-primary transition-colors bg-muted/30 cursor-pointer"
                                onClick={() => handleMentorClick(mentor)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full border-2 border-border bg-muted overflow-hidden">
                                            <img src={mentor.avatar} alt={mentor.name} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg leading-none">{mentor.name}</h4>
                                            <p className="text-xs text-muted-foreground font-sans mt-0.5">{mentor.role}</p>
                                        </div>
                                    </div>
                                    <span className="bg-green-100 text-green-800 border border-green-300 text-xs font-bold px-2 py-0.5 rounded-full transform rotate-3">
                                        {mentor.match}% Match
                                    </span>
                                </div>
                                <div className="space-y-2 mb-4 font-sans text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Teaches:</span>
                                        <span className="font-bold decoration-yellow-300 underline decoration-2 text-foreground">{mentor.teaches[0]}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Wants:</span>
                                        <span className="font-bold decoration-blue-300 underline decoration-2 text-foreground">{mentor.wants[0]}</span>
                                    </div>
                                </div>
                                <Link to={`/dashboard/messages?userId=${mentor.id}`} className="w-full">
                                    <Button className="w-full sketch-button bg-card text-foreground hover:bg-muted h-10 text-sm">
                                        Connect
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Daily Goal - Index Card Style */}
                <div className="relative">
                    {/* Tape effect */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/50 rotate-1 backdrop:blur-sm transform z-10 border border-white/20 shadow-sm" style={{ clipPath: 'polygon(0% 5%, 5% 0%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0% 95%)' }}></div>

                    <div className="bg-card p-6 shadow-[2px_10px_20px_-5px_var(--sketch-shadow)] border border-border flex flex-col h-full transform rotate-1 text-foreground" style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '100% 24px', lineHeight: '24px' }}>
                        <div className="flex justify-between items-start mb-6 mt-4">
                            <div className="flex items-center gap-2">
                                <Target className="w-6 h-6 text-destructive" />
                                <h2 className="text-xl font-bold bg-card px-2">Daily Goal</h2>
                            </div>
                            <span className="text-xs font-bold font-sans bg-destructive/10 text-destructive px-2 py-1 rounded">12h left</span>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2">Complete Session</h3>
                            <p className="font-sans text-muted-foreground mb-6 bg-card/50 p-2">
                                Teach or learn for at least 30 minutes today.
                            </p>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs font-bold font-sans">
                                    <span>Progress</span>
                                    <span>{user?.dailyGoalProgress || 0}/1</span>
                                </div>
                                <div className="h-4 bg-muted border-2 border-border rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-foreground rounded-full img-pattern transition-all duration-500"
                                        style={{ width: `${Math.min(((user?.dailyGoalProgress || 0) / 1) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Link to="/dashboard/sessions?tab=tasks" className="w-1/2">
                                <Button variant="outline" className="w-full sketch-button border-border hover:bg-muted">
                                    View Schedule
                                </Button>
                            </Link>
                            <Link to="/dashboard/Matches" className="w-1/2">
                                <Button className="w-full sketch-button bg-foreground text-background hover:bg-foreground/90">
                                    Find Session
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mentor Profile Modal */}
            <MentorProfileModal
                mentor={selectedMentor}
                isOpen={showMentorModal}
                onClose={() => setShowMentorModal(false)}
            />
        </div>
    );
}
