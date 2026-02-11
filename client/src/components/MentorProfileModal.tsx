import { X, Mail, Calendar, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Mentor {
    name: string;
    avatar: string;
    role: string;
    match: number;
    teaches: string[];
    wants: string[];
    bio?: string;
    experience?: string;
    availability?: string;
}

interface MentorProfileModalProps {
    mentor: Mentor | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function MentorProfileModal({ mentor, isOpen, onClose }: MentorProfileModalProps) {
    if (!isOpen || !mentor) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
            <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                {/* Close Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 rounded-full hover:bg-muted"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </Button>

                {/* Header Section */}
                <div className="flex items-start gap-4 mb-6">
                    <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        className="w-24 h-24 rounded-full border-4 border-border bg-muted object-cover"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-black">{mentor.name}</h2>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full text-sm font-bold border-2 border-border">
                                {mentor.match}% Match
                            </span>
                        </div>
                        <p className="text-muted-foreground font-bold text-lg">{mentor.role}</p>
                    </div>
                </div>

                {/* Skills Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Teaches */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-border rounded-lg p-4">
                        <h3 className="font-black text-lg mb-3 flex items-center">
                            <Award className="w-5 h-5 mr-2" /> Teaches
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {mentor.teaches.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold border-2 border-border"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Wants to Learn */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-border rounded-lg p-4">
                        <h3 className="font-black text-lg mb-3 flex items-center">
                            <Award className="w-5 h-5 mr-2" /> Wants to Learn
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {mentor.wants.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold border-2 border-border"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bio Section */}
                {mentor.bio && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-border rounded-lg p-4 mb-6">
                        <h3 className="font-black text-lg mb-2">About</h3>
                        <p className="text-foreground font-sans leading-relaxed">{mentor.bio}</p>
                    </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {mentor.experience && (
                        <div className="flex items-center gap-2 bg-card border-2 border-border rounded-lg p-3">
                            <Award className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground font-bold">Experience</p>
                                <p className="font-black">{mentor.experience}</p>
                            </div>
                        </div>
                    )}
                    {mentor.availability && (
                        <div className="flex items-center gap-2 bg-card border-2 border-border rounded-lg p-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground font-bold">Availability</p>
                                <p className="font-black">{mentor.availability}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        className="flex-1 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[4px_4px_0px_0px_var(--sketch-shadow)] active:translate-y-[2px] active:shadow-none transition-all border-2 border-border"
                    >
                        <Mail className="w-4 h-4 mr-2" /> Connect
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 font-bold border-2 border-border shadow-[4px_4px_0px_0px_var(--sketch-shadow)] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        <Calendar className="w-4 h-4 mr-2" /> Schedule Session
                    </Button>
                </div>
            </div>
        </div>
    );
}
