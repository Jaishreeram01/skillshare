import { useState, useEffect } from "react";
import { Medal, Zap, Crown, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState<"xp" | "streak">("xp");
    const [leaders, setLeaders] = useState<any[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch leaderboard data when component mounts or tab changes
    useEffect(() => {
        fetchLeaderboard();
    }, [activeTab]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/leaderboard?sortBy=${activeTab}`);
            setLeaders(data.leaders || []);
            setCurrentUserRank(data.currentUser);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setLoading(false);
        }
    };

    // Use fetched data, fallback to empty if loading
    const sortedLeaders = leaders;

    return (
        <div className="space-y-8 animate-fade-in pb-10 font-handwritten">
            <div className="text-center space-y-4 py-8 relative">
                {/* Doodle Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-yellow-200 transform -rotate-2 rounded-sm -z-10 opacity-50 border-2 border-border border-dashed" />
                <h1 className="text-5xl font-black tracking-tight text-foreground relative inline-block">
                    Global Leaderboard 🏆
                    <span className="absolute -bottom-2 left-0 w-full h-2 bg-yellow-400 -z-10 transform skew-x-12" />
                </h1>
                <p className="text-muted-foreground text-xl font-bold">Top mentors and learners of the week</p>

                {/* Tab Buttons */}
                <div className="flex justify-center gap-4 pt-4">
                    <Button
                        variant={activeTab === "xp" ? "default" : "outline"}
                        className={`font-bold border-2 border-border shadow-[3px_3px_0px_0px_var(--sketch-shadow)] ${activeTab === "xp" ? "bg-blue-600 text-white" : ""}`}
                        onClick={() => setActiveTab("xp")}
                    >
                        <Zap className="w-4 h-4 mr-2" /> Total XP
                    </Button>
                    <Button
                        variant={activeTab === "streak" ? "default" : "outline"}
                        className={`font-bold border-2 border-border shadow-[3px_3px_0px_0px_var(--sketch-shadow)] ${activeTab === "streak" ? "bg-orange-600 text-white" : ""}`}
                        onClick={() => setActiveTab("streak")}
                    >
                        <Flame className="w-4 h-4 mr-2" /> Streak
                    </Button>
                </div>
            </div>

            {/* Top 3 Podium */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">Loading leaderboard...</p>
                </div>
            ) : sortedLeaders.length >= 3 ? (
                <div className="flex justify-center items-end gap-4 md:gap-8 mb-12">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-4 border-border relative mb-4 bg-slate-200">
                            <img src={sortedLeaders[1].avatar} className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-black border-2 border-black text-xs font-black px-2 py-0.5 rounded-full transform -rotate-6">#2</div>
                        </div>
                        <h3 className="font-black text-lg text-foreground">{sortedLeaders[1].name}</h3>
                        <span className="text-sm text-muted-foreground font-bold font-sans">
                            {activeTab === "xp" ? `${sortedLeaders[1].xp} XP` : `${sortedLeaders[1].streak} Day Streak`}
                        </span>
                        <div className="h-32 w-24 bg-slate-300 border-2 border-border border-b-0 rounded-t-xl mt-4 relative">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl font-black text-black/20">2</div>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center -mb-8 z-10 w-32">
                        <Crown className="w-12 h-12 text-yellow-500 mb-2 animate-bounce stroke-[3px] stroke-black fill-yellow-300" />
                        <div className="w-28 h-28 rounded-full border-4 border-border relative mb-4 shadow-[4px_4px_0px_0px_var(--sketch-shadow)] bg-yellow-100">
                            <img src={sortedLeaders[0].avatar} className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black border-2 border-black text-sm font-black px-3 py-0.5 rounded-full transform rotate-3">#1</div>
                        </div>
                        <h3 className="font-black text-xl text-foreground">{sortedLeaders[0].name}</h3>
                        <span className="text-sm text-foreground font-bold font-sans">
                            {activeTab === "xp" ? `${sortedLeaders[0].xp} XP` : `${sortedLeaders[0].streak} Day Streak`}
                        </span>
                        <div className="h-48 w-full bg-yellow-300 border-2 border-border border-b-0 rounded-t-xl mt-4 relative">
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-4xl font-black text-black/20">1</div>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border-4 border-border relative mb-4 bg-orange-200">
                            <img src={sortedLeaders[2].avatar} className="w-full h-full rounded-full object-cover" />
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-400 text-black border-2 border-black text-xs font-black px-2 py-0.5 rounded-full transform rotate-6">#3</div>
                        </div>
                        <h3 className="font-black text-lg text-foreground">{sortedLeaders[2].name}</h3>
                        <span className="text-sm text-muted-foreground font-bold font-sans">
                            {activeTab === "xp" ? `${sortedLeaders[2].xp} XP` : `${sortedLeaders[2].streak} Day Streak`}
                        </span>
                        <div className="h-24 w-24 bg-orange-300 border-2 border-border border-b-0 rounded-t-xl mt-4 relative">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl font-black text-black/20">3</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">Not enough users for podium display yet.</p>
                </div>
            )}

            {/* List */}
            <div className="bg-card rounded-xl border-2 border-border overflow-hidden max-w-4xl mx-auto shadow-[4px_4px_0px_0px_var(--sketch-shadow)] relative">
                {/* Spiral binding mimic */}
                <div className="absolute top-0 left-0 w-full h-6 bg-transparent border-b-2 border-dashed border-border z-10" />

                <div className="grid grid-cols-12 gap-4 p-4 border-b-2 border-border bg-muted/50 text-sm font-black text-foreground uppercase tracking-wider font-sans">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-1"></div>
                    <div className="col-span-4">User</div>
                    <div className="col-span-2 text-center">Matches</div>
                    <div className="col-span-2 text-center">Streak</div>
                    <div className="col-span-2 text-right">Total XP</div>
                </div>
                {sortedLeaders.map((leader, i) => (
                    <div key={leader.rank} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors border-b border-border/10 font-sans font-bold ${i < 3 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                        <div className="col-span-1 text-center font-black text-xl text-muted-foreground">
                            {leader.rank}
                        </div>
                        <div className="col-span-1">
                            <img src={leader.avatar} className="w-10 h-10 rounded-full border-2 border-border" />
                        </div>
                        <div className="col-span-4 font-bold flex items-center text-lg font-handwritten text-foreground">
                            {leader.name} <span className="ml-2 text-lg">{leader.country}</span>
                            {i === 0 && <Medal className="w-5 h-5 text-yellow-500 ml-2 drop-shadow-sm" />}
                        </div>
                        <div className="col-span-2 text-center text-muted-foreground font-bold">
                            {leader.matches}
                        </div>
                        <div className="col-span-2 text-center flex items-center justify-center text-orange-600 font-black">
                            {leader.streak} <Zap className="w-4 h-4 ml-1 fill-orange-500 text-foreground" />
                        </div>
                        <div className="col-span-2 text-right font-black text-foreground">
                            {leader.xp.toLocaleString()} <span className="text-xs text-muted-foreground">XP</span>
                        </div>
                    </div>
                ))}

                {/* User's own rank - Sticky Note style */}
                {currentUserRank && (
                    <div className="grid grid-cols-12 gap-4 p-4 items-center bg-foreground text-background mt-0 border-t-2 border-border relative">
                        <div className="col-span-1 text-center font-black text-xl">
                            {currentUserRank.rank}
                        </div>
                        <div className="col-span-1">
                            {currentUserRank.avatar ? (
                                <img src={currentUserRank.avatar} className="w-10 h-10 rounded-full border-2 border-background object-cover" alt="You" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-background/20 border-2 border-background" />
                            )}
                        </div>
                        <div className="col-span-4 font-bold flex items-center text-lg font-handwritten">
                            You {currentUserRank.country && <span className="ml-2">{currentUserRank.country}</span>}
                        </div>
                        <div className="col-span-2 text-center font-bold opacity-90 font-sans">
                            {currentUserRank.matches}
                        </div>
                        <div className="col-span-2 text-center flex items-center justify-center font-bold font-sans">
                            {currentUserRank.streak} <Zap className="w-4 h-4 ml-1 fill-background" />
                        </div>
                        <div className="col-span-2 text-right font-black font-sans">
                            {currentUserRank.xp} <span className="text-xs font-normal opacity-70">XP</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
