import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Zap,
    MessageSquare,

    Trophy,
    Calendar,
    Settings,
    LogOut,
    Briefcase,
    BookOpen,
    X
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useSocket } from "@/contexts/SocketContext";

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { messageCount, matchCount, resetMessageCount, resetMatchCount } = useSocket();

    const handleSignOut = async () => {
        await signOut(auth);
        navigate("/login");
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
        {
            icon: Zap,
            label: "Matches",
            path: "/dashboard/matches",
            badge: matchCount > 0 ? String(matchCount) : undefined,
            onClick: resetMatchCount
        },
        { icon: Calendar, label: "Sessions", path: "/dashboard/sessions" },

        { icon: Briefcase, label: "Projects", path: "/dashboard/projects" },
        { icon: Trophy, label: "Leaderboard", path: "/dashboard/leaderboard" },
        {
            icon: MessageSquare,
            label: "Messages",
            path: "/dashboard/messages",
            badge: messageCount > 0 ? String(messageCount) : undefined,
            onClick: resetMessageCount
        },
        { icon: BookOpen, label: "My Profile", path: "/dashboard/profile" },
    ];

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 z-50 h-screen w-64 bg-background border-r-2 border-border transition-transform duration-300 lg:translate-x-0 font-handwritten",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="h-full flex flex-col">
                <div className="h-16 flex items-center justify-between px-6 border-b-2 border-border bg-muted/50">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-foreground text-background rounded-md flex items-center justify-center transform -rotate-3 border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)]">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-foreground transform rotate-1">
                            Skill<span className="text-primary underline decoration-wavy decoration-2">Share</span>
                        </span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-foreground hover:bg-muted border-2 border-transparent hover:border-border rounded-lg"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Links */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => {
                                    item.onClick?.();
                                    onClose?.();
                                }}
                                className={cn(
                                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-lg font-bold transition-all duration-200 group border-2 border-transparent hover:translate-x-1",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-border shadow-[3px_3px_0px_0px_var(--sketch-shadow)] transform -rotate-1"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/10"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className={cn(
                                        "ml-auto text-[12px] px-2 py-0.5 rounded-full font-bold border-2 border-border",
                                        isActive ? "bg-background text-foreground" : "bg-destructive/10 text-destructive"
                                    )}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Settings */}
                <div className="p-4 border-t-2 border-border bg-muted/30 space-y-2">
                    <Link
                        to="/dashboard/profile"
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-bold text-muted-foreground hover:bg-background hover:border-2 hover:border-border hover:shadow-[2px_2px_0px_0px_var(--sketch-shadow)] transition-all"
                    >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-bold text-destructive hover:bg-destructive/10 hover:border-2 hover:border-destructive transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
