import { Bell, Search, Menu, Sun, Moon, LogOut, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
    const { setTheme, theme } = useTheme();
    const { user, profile } = useAuth();
    const { notifications, clearNotifications } = useSocket();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut(auth);
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-30 w-full bg-background/95 backdrop-blur-sm border-b-2 border-border transition-all duration-300 font-handwritten supports-[backdrop-filter]:bg-background/60">
            <div className="h-16 px-6 flex items-center justify-between">
                {/* ... (Search and Menu keep as is) */}
                <div className="flex items-center flex-1 gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className="lg:hidden text-foreground hover:bg-muted border-2 border-transparent hover:border-border rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </Button>
                    <div className="relative w-full max-w-md hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Find a mentor, skill, or project... ✏️"
                            className="pl-10 bg-background border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all rounded-lg font-sans shadow-[2px_2px_0px_0px_var(--sketch-shadow)]"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full border-2 border-transparent hover:border-border hover:bg-muted"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted border-2 border-transparent hover:border-border rounded-lg relative">
                                <Bell className="w-6 h-6" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-background animate-pulse"></span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 bg-background border-2 border-border shadow-[4px_4px_0px_0px_var(--sketch-shadow)] p-2 font-handwritten">
                            <div className="flex items-center justify-between p-2 mb-2">
                                <h3 className="text-lg font-bold">Recent Notifications</h3>
                                <Button variant="ghost" size="sm" onClick={clearNotifications} className="text-xs font-bold text-muted-foreground hover:text-destructive">
                                    Clear All
                                </Button>
                            </div>
                            <DropdownMenuSeparator className="bg-border mb-2" />
                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground font-bold italic">
                                        No recent notifications.
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <DropdownMenuItem key={notif.id} className="p-3 rounded-lg border-2 border-transparent hover:border-border hover:bg-muted/50 transition-all cursor-pointer flex flex-col items-start gap-1">
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-black text-sm">{notif.title}</span>
                                                <span className="text-[10px] text-muted-foreground font-sans uppercase">
                                                    {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-sans line-clamp-2">
                                                {notif.description}
                                            </p>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-3 px-3 py-1 bg-muted/50 border-2 border-border rounded-xl shadow-[2px_2px_0px_0px_var(--sketch-shadow)]">
                        <div className="flex items-center gap-1.5" title="Current Streak">
                            <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
                            <span className="font-black text-lg">{profile?.streak || 0}</span>
                        </div>
                        <div className="w-px h-4 bg-border/50"></div>
                        <div className="flex items-center gap-1.5" title="Total XP">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="font-black text-lg">{profile?.xp || 0} XP</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border/20 mx-1 hidden sm:block"></div>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link to="/dashboard/profile">
                                <div className="flex items-center gap-3 pl-1 cursor-pointer hover:bg-muted p-1.5 rounded-lg border-2 border-transparent hover:border-border transition-all">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-base font-bold text-foreground leading-none">{user.displayName || "User"}</p>
                                        <p className="text-xs text-muted-foreground font-bold mt-0.5">Learner</p>
                                    </div>
                                    <Avatar className="h-9 w-9 border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)]">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback className="font-bold bg-primary text-primary-foreground">
                                            {user.displayName?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button variant="premium" size="sm">Sign In</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
