import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, MessageSquare, Calendar, Star, ThumbsUp, ChevronDown, ChevronUp, X, Bookmark, BookmarkCheck } from "lucide-react";
import MentorProfileModal from "@/components/MentorProfileModal";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Matches() {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const [teachInput, setTeachInput] = useState("");
    const [learnInput, setLearnInput] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState<any>(null);
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [showSavedMatches, setShowSavedMatches] = useState(false);

    // Dynamic state
    const [matches, setMatches] = useState<any[]>([]);
    const [savedMatches, setSavedMatches] = useState<any[]>([]);
    const [reward, setReward] = useState<{ xp: number, streak: number, isMutual?: boolean } | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [schedulingUser, setSchedulingUser] = useState<any>(null);
    const [schedulingData, setSchedulingData] = useState({ topic: "General Mentorship", date: "", duration: "60", meetLink: "" });

    // Fetch initial matches and saved matches on mount
    useEffect(() => {
        fetchMatches();
        fetchSavedMatches();
    }, []);

    const fetchMatches = async (customTeach?: string, customLearn?: string) => {
        try {
            const params = new URLSearchParams();
            if (customTeach) params.append('teach', customTeach);
            if (customLearn) params.append('learn', customLearn);

            const { data } = await api.get(`/matches/suggestions?${params.toString()}`);

            // Map backend User to frontend match format
            const formatted = data.map((u: any) => ({
                id: u.id,
                name: u.name,
                avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
                rating: u.trustScore ? u.trustScore / 20 : 4.5, // Convert 0-100 to 0-5
                location: u.location || u.country || "Unknown",
                teaches: u.skills?.join(", ") || "",
                wants: u.learning?.join(", ") || "",
                matchScore: u.matchScore || u.trustScore || 0,
                bio: u.bio || u.headline || "No bio available.",
                badges: u.badges?.map((b: any) => b.name) || [],
                experience: u.experienceLevel || "Intermediate",
                availability: u.availability || "Flexible"
            }));

            setMatches(formatted);
        } catch (error) {
            console.error("Failed to fetch matches", error);
        }
    };

    const fetchSavedMatches = async () => {
        try {
            const { data } = await api.get('/matches/saved');

            // Map to frontend format
            const formatted = data.map((u: any) => ({
                id: u.id,
                name: u.name,
                avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}`,
                role: u.headline || "Developer",
                match: u.matchScore || u.trustScore || 0,
                teaches: u.skills || [],
                wants: u.learning || [],
                bio: u.bio || "No bio available.",
                experience: u.experienceLevel || "Intermediate",
                availability: u.availability || "Flexible",
                rating: u.trustScore ? u.trustScore / 20 : 4.5,
                location: u.location || u.country || "Unknown"
            }));

            setSavedMatches(formatted);
        } catch (error) {
            console.error("Failed to fetch saved matches", error);
        }
    };

    const handleMentorClick = (match: any) => {
        const mentorData = {
            name: match.name,
            avatar: match.avatar,
            role: match.role || "Developer",
            match: match.matchScore || match.match,
            teaches: match.teaches.split ? match.teaches.split(", ") : match.teaches,
            wants: match.wants.split ? match.wants.split(", ") : match.wants,
            bio: match.bio,
            experience: match.experience || "3+ years",
            availability: match.availability || "Flexible"
        };
        setSelectedMentor(mentorData);
        setShowMentorModal(true);
    };

    const handleSearch = () => {
        setIsSearching(true);
        // Trigger search with custom inputs
        fetchMatches(teachInput, learnInput).finally(() => {
            setIsSearching(false);
        });
    };

    // Handle save match
    const handleSaveMatch = async (matchId: string) => {
        try {
            const { data } = await api.post('/matches/saved', null, {
                params: { matchedUserId: matchId }
            });
            // Show reward popup
            if (data.xpAwarded) {
                setReward({
                    xp: data.xpAwarded,
                    streak: data.streakBonus || 0,
                    isMutual: data.is_mutual
                });
                refreshProfile(); // Refresh global stats
                setTimeout(() => setReward(null), 5000); // Longer for mutual
            }
            // Refresh saved matches
            fetchSavedMatches();
        } catch (error) {
            console.error("Failed to save match", error);
        }
    };

    const handleUnsaveMatch = async (matchId: string) => {
        try {
            await api.delete(`/matches/saved/${matchId}`);
            // Refresh saved matches
            fetchSavedMatches();
        } catch (error) {
            console.error("Failed to unsave match", error);
        }
    };

    const handleScheduleSession = async () => {
        if (!schedulingUser || !schedulingData.date) {
            alert("Please select a date and time.");
            return;
        }
        try {
            await api.post('/sessions/', {
                teacherId: schedulingUser.id,
                learnerId: user?.uid, // Current user is learner
                topic: schedulingData.topic,
                scheduledAt: new Date(schedulingData.date).toISOString(),
                duration: parseInt(schedulingData.duration),
                meetLink: schedulingData.meetLink,
                status: "PENDING"
            });
            setShowScheduleModal(false);
            // Optional: show a small toast or success msg
        } catch (error) {
            console.error("Failed to schedule session", error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in font-handwritten relative">
            {/* Reward Notification Popup */}
            {reward && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in duration-300">
                    <div className={`bg-yellow-100 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 ${reward.isMutual ? 'bg-pink-100 border-pink-500 shadow-pink-500' : '-rotate-3'}`}>
                        <Sparkles className={`w-12 h-12 animate-bounce ${reward.isMutual ? 'text-pink-500' : 'text-yellow-600'}`} />
                        <h2 className={`text-4xl font-black uppercase tracking-tighter ${reward.isMutual ? 'text-pink-600' : 'text-black'}`}>
                            {reward.isMutual ? "IT'S A MUTUAL MATCH! 💖" : "Match Saved!"}
                        </h2>
                        {reward.isMutual && <p className="font-bold text-lg -mt-2">A session has been scheduled automatically!</p>}
                        <div className="flex gap-4">
                            <div className="bg-white px-4 py-2 border-2 border-black font-black text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                +{reward.xp} XP
                            </div>
                            {reward.streak > 0 && (
                                <div className="bg-orange-100 px-4 py-2 border-2 border-black font-black text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    +{reward.streak} Streak
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight -rotate-1">AI Skill Matching 🤖</h1>
                    <p className="text-muted-foreground mt-1 font-bold">Find your perfect learning partner based on mutual exchange.</p>
                </div>
                <Button
                    variant="outline"
                    className="hidden md:flex sketch-button bg-yellow-100 hover:bg-yellow-200 text-black border-border shadow-[3px_3px_0px_0px_var(--sketch-shadow)]"
                    onClick={() => setShowSavedMatches(!showSavedMatches)}
                >
                    <Star className="w-4 h-4 mr-2 text-black fill-yellow-400" /> Saved Matches
                    {showSavedMatches ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
            </div>

            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-card border-2 border-border shadow-[4px_4px_0px_0px_var(--sketch-shadow)] relative overflow-hidden transform rotate-1">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl -z-10" />

                <div className="space-y-4">
                    <label className="text-lg font-bold text-foreground">Skills I Can Teach 🎓</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <div className="w-3 h-3 rounded-full bg-foreground border-2 border-background animate-pulse" />
                        </div>
                        <Input
                            placeholder="e.g., React, Tailwind, Figma..."
                            className="pl-8 border-2 border-border focus:border-primary h-12 text-lg font-sans rounded-none shadow-[2px_2px_0px_0px_var(--sketch-shadow)] bg-background"
                            value={teachInput}
                            onChange={(e) => setTeachInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-lg font-bold text-foreground">Skills I Want to Learn 🧠</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <div className="w-3 h-3 rounded-full bg-foreground border-2 border-background animate-pulse" />
                        </div>
                        <Input
                            placeholder="e.g., Node.js, Python, AWS..."
                            className="pl-8 border-2 border-border focus:border-primary h-12 text-lg font-sans rounded-none shadow-[2px_2px_0px_0px_var(--sketch-shadow)] bg-background"
                            value={learnInput}
                            onChange={(e) => setLearnInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-center mt-4">
                    <Button
                        size="lg"
                        className="w-full md:w-auto px-12 h-14 text-xl sketch-button bg-foreground text-background hover:bg-foreground/90 shadow-[3px_3px_0px_0px_var(--sketch-shadow)]"
                        onClick={handleSearch}
                        disabled={isSearching}
                    >
                        {isSearching ? (
                            <span className="flex items-center">
                                <Sparkles className="w-6 h-6 mr-2 animate-spin" /> Analyzing 10k+ Profiles...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Sparkles className="w-6 h-6 mr-2" /> Find My Perfect Match
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Saved Matches Section */}
            {showSavedMatches && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-border rounded-xl p-6 shadow-[4px_4px_0px_0px_var(--sketch-shadow)] animate-in slide-in-from-top">
                    <h2 className="text-2xl font-black mb-4 flex items-center">
                        <Star className="w-6 h-6 mr-2 fill-yellow-400 text-yellow-600" />
                        Your Saved Matches ({savedMatches.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedMatches.map((match) => (
                            <div
                                key={match.id}
                                className="bg-card border-2 border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                                onClick={() => handleMentorClick(match)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <img src={match.avatar} alt={match.name} className="w-12 h-12 rounded-full border-2 border-border" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-foreground leading-tight">{match.name}</h4>
                                            <span className="bg-green-100 text-green-800 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border border-green-200">
                                                {match.match}% Match
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-muted-foreground font-sans font-bold uppercase tracking-widest">{match.role}</p>
                                            <div className="flex items-center gap-0.5 bg-yellow-50 px-1 rounded border border-yellow-100">
                                                <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-600" />
                                                <span className="text-[10px] font-black text-yellow-700">{match.rating * 20}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs font-sans space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Teaches:</span>
                                        <span className="font-bold">{match.teaches[0]}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Wants:</span>
                                        <span className="font-bold">{match.wants[0]}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 w-full text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnsaveMatch(match.id);
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Section */}
            {matches.length === 0 && !isSearching ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">No matches found. Try adjusting your search criteria!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {matches.map((match, i) => (
                        <div key={match.id} className={`group relative bg-card p-0 rounded-xl border-2 border-border overflow-visible hover:translate-y-1 transition-all duration-300 shadow-[4px_4px_0px_0px_var(--sketch-shadow)] ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                            {/* Match Score Badge */}
                            <div className="absolute -top-4 -right-4 z-10">
                                <div className="bg-green-400 border-2 border-border px-3 py-1 flex items-center shadow-[2px_2px_0px_0px_var(--sketch-shadow)] transform rotate-3">
                                    <span className="font-black text-black">{match.matchScore}% Match</span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center space-x-4 mb-4 relative">
                                    <div className="relative">
                                        <img src={match.avatar} alt={match.name} className="w-16 h-16 rounded-full object-cover border-2 border-border bg-muted" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)] hover:bg-muted"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const isSaved = savedMatches.some(sm => sm.id === match.id);
                                                if (isSaved) handleUnsaveMatch(match.id);
                                                else handleSaveMatch(match.id);
                                            }}
                                        >
                                            {savedMatches.some(sm => sm.id === match.id) ? (
                                                <BookmarkCheck className="w-4 h-4 text-primary fill-primary" />
                                            ) : (
                                                <Bookmark className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground leading-tight">{match.name}</h3>
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <div className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded border-2 border-yellow-200 flex items-center gap-1.5 w-fit shadow-[2px_2px_0px_0px_rgba(161,98,7,0.1)]">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-600" />
                                                <span className="text-xs font-black font-sans uppercase tracking-tight">Trust: {match.matchScore}</span>
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground font-sans uppercase tracking-widest leading-none">• {match.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-foreground font-medium text-sm line-clamp-2 mb-6 font-handwritten text-lg leading-tight">
                                    "{match.bio}"
                                </p>

                                <div className="space-y-3 mb-6 font-sans">
                                    <div className="flex justify-between items-center text-sm bg-muted/50 p-2 border-2 border-border/10">
                                        <span className="font-bold text-muted-foreground">Teaches</span>
                                        <span className="font-bold text-foreground border-b-2 border-yellow-300">{match.teaches}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm bg-muted/50 p-2 border-2 border-border/10">
                                        <span className="font-bold text-muted-foreground">Wants</span>
                                        <span className="font-bold text-foreground border-b-2 border-blue-300">{match.wants}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end mb-6 font-sans">
                                    <Button
                                        size="sm"
                                        className="px-6 bg-black text-white hover:bg-black/80 border-2 border-black shadow-[3px_3px_0px_0px_var(--sketch-shadow)] font-black h-10 transition-transform active:translate-y-1 active:shadow-none"
                                        onClick={() => {
                                            setSchedulingUser(match);
                                            setShowScheduleModal(true);
                                        }}
                                    >
                                        <Calendar className="w-4 h-4 mr-2" /> Schedule
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 border-2 border-black bg-white text-black font-black text-lg shadow-[4px_4px_0px_0px_var(--sketch-shadow)] hover:bg-muted transition-all active:translate-y-1 active:shadow-none"
                                        onClick={() => handleMentorClick(match)}
                                    >
                                        View Profile
                                    </Button>
                                    <Button
                                        className="w-full h-12 bg-[#7c3aed] text-white font-black text-lg shadow-[4px_4px_0px_0px_var(--sketch-shadow)] hover:bg-[#6d28d9] transition-all active:translate-y-1 active:shadow-none border-2 border-black"
                                        onClick={() => {
                                            navigate(`/dashboard/messages?userId=${match.id}`);
                                        }}
                                    >
                                        <MessageSquare className="w-5 h-5 mr-2" /> Message
                                    </Button>
                                </div>
                            </div>

                            {/* Bottom Action Strip */}
                            <div className="bg-muted px-6 py-3 border-t-2 border-border flex justify-between items-center text-xs font-bold text-muted-foreground font-sans">
                                <span className="flex items-center"><ThumbsUp className="w-3 h-3 mr-1" /> 95% Compatibility</span>
                                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> Available Evenings</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mentor Profile Modal */}
            <MentorProfileModal
                mentor={selectedMentor}
                isOpen={showMentorModal}
                onClose={() => setShowMentorModal(false)}
            />
            {/* Scheduling Modal */}
            {showScheduleModal && schedulingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-background w-full max-w-md rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full hover:bg-muted"
                            onClick={() => setShowScheduleModal(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <h2 className="text-2xl font-black mb-1 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Schedule Session
                        </h2>
                        <p className="text-muted-foreground font-bold text-sm mb-6">Book a 1:1 with {schedulingUser.name}</p>

                        <div className="space-y-4 font-sans">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Topic</label>
                                <Input
                                    placeholder="e.g. Node.js Architecture"
                                    value={schedulingData.topic}
                                    onChange={(e) => setSchedulingData({ ...schedulingData, topic: e.target.value })}
                                    className="border-2 border-border font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Date & Time</label>
                                    <Input
                                        type="datetime-local"
                                        value={schedulingData.date}
                                        onChange={(e) => setSchedulingData({ ...schedulingData, date: e.target.value })}
                                        className="border-2 border-border font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Duration (min)</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border-2 border-border bg-background font-bold"
                                        value={schedulingData.duration}
                                        onChange={(e) => setSchedulingData({ ...schedulingData, duration: e.target.value })}
                                    >
                                        <option value="30">30 min</option>
                                        <option value="60">1 hour</option>
                                        <option value="90">1.5 hours</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider mb-2 block">Meeting Link (Opt)</label>
                                <Input
                                    placeholder="Zoom / Meet / Discord link"
                                    value={schedulingData.meetLink}
                                    onChange={(e) => setSchedulingData({ ...schedulingData, meetLink: e.target.value })}
                                    className="border-2 border-border font-bold"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 font-bold border-2 border-border"
                                    onClick={() => setShowScheduleModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 font-bold bg-green-600 hover:bg-green-700 text-white shadow-[4px_4px_0px_0px_var(--sketch-shadow)] active:translate-y-[2px] active:shadow-none transition-all"
                                    onClick={handleScheduleSession}
                                >
                                    Confirm Booking
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
