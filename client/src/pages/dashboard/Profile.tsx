import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, ShieldCheck, MapPin, Globe, PenTool, Award, Briefcase, User, X, Plus, Trash2, CheckCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

import api from "@/services/api";
import { useEffect } from "react";

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [showBlueprintsModal, setShowBlueprintsModal] = useState(false);
    const [selectedBlueprint, setSelectedBlueprint] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState({
        name: "",
        headline: "",
        age: 0,
        country: "",
        location: "",
        languages: "",
        experienceLevel: "Intermediate",
        availability: "Flexible",
        trustScore: 0,
        sessions: 0,
        xp: 0,
        level: 1,
        totalHours: 0,
        about: "",
        avatar: "",
        skills: [] as string[],
        learning: [] as string[],
        badges: [] as { name: string, level: string }[],
        blueprints: [] as { id: any, title: string, duration: string, description: string, projects: number }[]
    });

    // Temp state for editing
    const [formData, setFormData] = useState(user);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/users/me');
            const mappedUser = {
                ...user,
                ...data,
                about: data.bio || "" // map backend 'bio' to frontend 'about'
            };
            setUser(mappedUser);
            setFormData(mappedUser);
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = async () => {
        if (isEditing) {
            // Save changes
            try {
                const payload = {
                    ...formData,
                    bio: formData.about // map back to backend 'bio'
                };
                // Use PUT /users/me for updates
                const { data } = await api.put('/users/me', payload);
                const mappedUser = {
                    ...user,
                    ...data,
                    about: data.bio || ""
                };
                setUser(mappedUser);
                setFormData(mappedUser);
            } catch (error) {
                console.error("Failed to save profile", error);
            }
        } else {
            // Reset form data on cancel/start
            setFormData(user);
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field: 'skills' | 'learning', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    };

    const handleBlueprintChange = (id: any, field: string, value: any) => {
        const updatedBlueprints = formData.blueprints.map(bp =>
            bp.id === id ? { ...bp, [field]: value } : bp
        );
        setFormData(prev => ({ ...prev, blueprints: updatedBlueprints }));
    };

    const addBlueprint = () => {
        const newBp = {
            id: Date.now(),
            title: "New Blueprint",
            duration: "2 Weeks",
            description: "Description of your new course.",
            projects: 1
        };
        setFormData(prev => ({ ...prev, blueprints: [...prev.blueprints, newBp] }));
    };

    const removeBlueprint = (id: any) => {
        setFormData(prev => ({ ...prev, blueprints: prev.blueprints.filter(bp => bp.id !== id) }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-2xl font-black animate-bounce">Loading Profile... ✏️</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10 font-handwritten">
            {/* Header Card */}
            <div className="relative sketch-card p-0 overflow-hidden transform rotate-1 border-border">
                <div className="absolute top-0 left-0 w-full h-32 bg-gray-900 border-b-2 border-border" />

                <div className="relative flex flex-col md:flex-row items-center md:items-end gap-6 pt-12 px-8 pb-8">
                    <div className="relative w-32 h-32 rounded-xl border-2 border-border shadow-[4px_4px_0px_0px_var(--sketch-shadow)] overflow-hidden bg-card -rotate-3 z-10 group">
                        {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl text-white font-black">
                                {user.name?.charAt(0) || "👤"}
                            </div>
                        )}
                        {isEditing && (
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <PenTool className="w-8 h-8 text-white" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Convert to base64 for simple storage
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                handleChange('avatar', reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1 mb-2 z-10 w-full">
                        {isEditing ? (
                            <div className="space-y-3">
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="text-3xl font-black bg-white/50 border-2 border-border"
                                />
                                <Input
                                    value={formData.headline}
                                    onChange={(e) => handleChange('headline', e.target.value)}
                                    className="text-lg font-bold bg-white/50 border-2 border-border"
                                />
                                <div className="grid grid-cols-2 gap-2 max-w-sm">
                                    <Input
                                        placeholder="Location"
                                        value={formData.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="bg-white/50"
                                    />
                                    <Input
                                        placeholder="Languages"
                                        value={formData.languages}
                                        onChange={(e) => handleChange('languages', e.target.value)}
                                        className="bg-white/50"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-4xl font-black text-white">
                                    {user.name} <ShieldCheck className="w-6 h-6 inline text-blue-500 fill-blue-100" />
                                </h1>
                                <p className="text-muted-foreground font-bold text-lg">{user.headline}</p>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-muted-foreground font-sans font-bold flex-wrap">
                                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {user.location}, {user.country}</span>
                                    <span className="flex items-center"><Globe className="w-4 h-4 mr-1" /> {user.languages}</span>
                                    <span className="flex items-center"><User className="w-4 h-4 mr-1" /> {user.age} y/o</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto z-10">
                        <Button
                            onClick={handleEditToggle}
                            className={cn(
                                "sketch-button border-border transition-all",
                                isEditing ? "bg-green-500 text-white hover:bg-green-600" : "bg-yellow-300 text-black hover:bg-yellow-400"
                            )}
                        >
                            {isEditing ? "Save Changes 💾" : "Edit Profile ✏️"}
                        </Button>
                        {!isEditing && (
                            <Button variant="outline" className="sketch-button bg-card text-foreground hover:bg-muted border-border">
                                Share Portfolio
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar Stats & Info */}
                <div className="space-y-6">
                    {/* Compatibility/Info Card */}
                    <div className="sketch-card p-6 border-border bg-card -rotate-1">
                        <h3 className="font-bold text-xl text-foreground mb-4 flex items-center">
                            <Briefcase className="w-5 h-5 mr-2" /> Details
                        </h3>
                        {isEditing ? (
                            <div className="space-y-3 font-sans">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground">Age</label>
                                    <Input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground">Location</label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => handleChange('location', e.target.value)}
                                        className="h-8"
                                        placeholder="City, State"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground">Country</label>
                                    <Input
                                        value={formData.country}
                                        onChange={(e) => handleChange('country', e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground">Languages</label>
                                    <Input
                                        value={formData.languages}
                                        onChange={(e) => handleChange('languages', e.target.value)}
                                        className="h-8"
                                        placeholder="English, Spanish"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground">Experience</label>
                                    <select
                                        className="w-full flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border"
                                        value={formData.experienceLevel}
                                        onChange={(e) => handleChange('experienceLevel', e.target.value)}
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                        <option>Expert</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground">Availability</label>
                                    <select
                                        className="w-full flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border"
                                        value={formData.availability}
                                        onChange={(e) => handleChange('availability', e.target.value)}
                                    >
                                        <option>Weekdays</option>
                                        <option>Weekends</option>
                                        <option>Flexible</option>
                                        <option>Evenings</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-sm font-bold text-muted-foreground font-sans">
                                <div className="flex justify-between items-center border-b border-dashed border-border/50 pb-2">
                                    <span>Experience</span>
                                    <span className="text-foreground px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 border border-border rounded-sm transform -rotate-2">{user.experienceLevel}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed border-border/50 pb-2">
                                    <span>Availability</span>
                                    <span className="text-foreground">{user.availability}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed border-border/50 pb-2">
                                    <span>Level</span>
                                    <span className="text-foreground font-black text-lg">Lvl {user.level || 1}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed border-border/50 pb-2">
                                    <span>Total XP</span>
                                    <span className="text-foreground">{user.xp || 0} XP</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed border-border/50 pb-2">
                                    <span>Sessions</span>
                                    <span className="text-foreground">{user.sessions}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-dashed border-border/50 pb-2">
                                    <span>Hours</span>
                                    <span className="text-foreground">{user.totalHours || 0}h</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trust Score */}
                    <div className="bg-yellow-50 p-6 shadow-[2px_2px_0px_0px_var(--sketch-shadow)] border-2 border-border flex flex-col items-center text-center transform rotate-1 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-red-200/50 backdrop-blur-sm border border-white/50 rotate-1" />
                        <h3 className="font-bold mb-2 uppercase text-xs tracking-wider font-sans text-black">Trust Score</h3>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-6xl font-black text-black">{user.trustScore}</span>
                            <Star className="w-8 h-8 text-black fill-yellow-400" />
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="sketch-card p-6 rotate-1 border-border bg-card">
                        <h3 className="font-bold text-xl text-foreground mb-4 flex items-center"><Award className="w-6 h-6 mr-2 text-purple-500" /> Badges</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.badges.map(b => (
                                <div key={b.name} className={cn(
                                    "px-3 py-1.5 rounded-lg border-2 text-xs font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--sketch-shadow)]",
                                    b.level === 'gold' && "bg-yellow-200 border-border text-black",
                                    b.level === 'silver' && "bg-slate-200 border-border text-black",
                                    b.level === 'bronze' && "bg-orange-200 border-border text-black"
                                )}>
                                    <Award className="w-3 h-3" /> {b.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* About */}
                    <div className="sketch-card p-6 bg-card -rotate-1 relative border-border">
                        <h3 className="font-bold text-2xl text-foreground mb-4 flex items-center underline decoration-wavy decoration-yellow-400">
                            About Me
                        </h3>
                        {isEditing ? (
                            <textarea
                                className="w-full min-h-[120px] p-3 rounded-lg border-2 border-border bg-background text-foreground font-handwritten text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                value={formData.about}
                                onChange={(e) => handleChange('about', e.target.value)}
                            />
                        ) : (
                            <p className="text-xl text-muted-foreground leading-relaxed font-handwritten">{user.about}</p>
                        )}
                    </div>

                    {/* Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-card p-6 border-2 border-border shadow-[4px_4px_0px_0px_var(--sketch-shadow)] transform rotate-1">
                            <h3 className="font-bold text-lg text-foreground mb-4 flex items-center"><PenTool className="w-5 h-5 mr-2" /> I Can Teach</h3>
                            {isEditing ? (
                                <Input
                                    value={formData.skills.join(', ')}
                                    onChange={(e) => handleArrayChange('skills', e.target.value)}
                                    placeholder="Comma separated skills..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {user.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-green-200 text-black border-2 border-border font-bold text-sm transform hover:-rotate-2 transition-transform inline-block">{skill}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bg-foreground text-background p-6 border-2 border-border shadow-[4px_4px_0px_0px_var(--sketch-shadow)] transform -rotate-1">
                            <h3 className="font-bold text-lg text-background mb-4 flex items-center"><PenTool className="w-5 h-5 mr-2" /> I Want to Learn</h3>
                            {isEditing ? (
                                <Input
                                    className="text-black"
                                    value={formData.learning.join(', ')}
                                    onChange={(e) => handleArrayChange('learning', e.target.value)}
                                    placeholder="Comma separated skills..."
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {user.learning.map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-background text-foreground border-2 border-background rounded-none font-bold text-sm transform hover:rotate-2 transition-transform inline-block">{skill}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teaching Blueprints */}
                    <div className="sketch-card p-6 border-border bg-card transition-all">
                        <h3 className="font-bold text-2xl text-foreground mb-6">Teaching Blueprints 🏗️</h3>
                        <div className="space-y-4">
                            {/* Display only first 2 for preview */}
                            {user.blueprints.slice(0, 2).map((bp) => (
                                <div
                                    key={bp.id}
                                    onClick={() => setSelectedBlueprint(bp)}
                                    className="bg-muted/50 p-5 border-2 border-dashed border-border hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all cursor-pointer group relative"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-xl text-foreground group-hover:underline">{bp.title}</h4>
                                        <span className="text-xs bg-card px-2 py-1 border-2 border-border font-bold shadow-[2px_2px_0px_0px_var(--sketch-shadow)] text-foreground">{bp.duration}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-bold font-sans mb-4">{bp.description}</p>
                                </div>
                            ))}
                            <div className="text-center mt-4">
                                <Button
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowBlueprintsModal(true)}
                                >
                                    Click to View All / Edit Blueprints
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Blueprints Modal */}
            {showBlueprintsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-background w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full hover:bg-muted"
                            onClick={() => setShowBlueprintsModal(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <h2 className="text-3xl font-black text-foreground mb-6">Teaching Blueprints</h2>

                        <div className="space-y-6">
                            {formData.blueprints.map((bp) => (
                                <div key={bp.id} className="relative bg-card p-5 border-2 border-border rounded-lg shadow-sm">
                                    {isEditing && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                            onClick={() => removeBlueprint(bp.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}

                                    <div className="space-y-3">
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    value={bp.title}
                                                    onChange={(e) => handleBlueprintChange(bp.id, 'title', e.target.value)}
                                                    className="font-bold text-lg"
                                                    placeholder="Blueprint Title"
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={bp.duration}
                                                        onChange={(e) => handleBlueprintChange(bp.id, 'duration', e.target.value)}
                                                        className="w-1/3 text-sm"
                                                        placeholder="Duration"
                                                    />
                                                    <Input
                                                        value={bp.description}
                                                        onChange={(e) => handleBlueprintChange(bp.id, 'description', e.target.value)}
                                                        className="flex-1 text-sm"
                                                        placeholder="Description"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-xl text-foreground">{bp.title}</h4>
                                                    <span className="text-xs bg-muted px-2 py-1 rounded border border-border font-bold">{bp.duration}</span>
                                                </div>
                                                <p className="text-muted-foreground">{bp.description}</p>
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-2">
                                                    <span className="flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> {bp.projects} Projects</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isEditing && (
                                <Button
                                    onClick={addBlueprint}
                                    className="w-full border-2 border-dashed border-border bg-transparent hover:bg-muted text-foreground py-8"
                                >
                                    <Plus className="w-5 h-5 mr-2" /> Add New Blueprint
                                </Button>
                            )}

                            {!isEditing && formData.blueprints.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">No blueprints found.</p>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-3 border-t-2 border-border/10 pt-4">
                            <Button variant="outline" onClick={() => setShowBlueprintsModal(false)}>Close</Button>
                            {isEditing && (
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => {
                                        handleEditToggle(); // Save changes
                                        setShowBlueprintsModal(false);
                                    }}
                                >
                                    Save & Close
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Selected Blueprint Detail Modal */}
            {selectedBlueprint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-background w-full max-w-lg rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full hover:bg-muted"
                            onClick={() => setSelectedBlueprint(null)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <div className="mb-6">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-200 uppercase tracking-wide">Blueprint Details</span>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Title</label>
                                    <Input
                                        value={selectedBlueprint.title}
                                        onChange={(e) => {
                                            const updated = { ...selectedBlueprint, title: e.target.value };
                                            setSelectedBlueprint(updated);
                                            handleBlueprintChange(selectedBlueprint.id, 'title', e.target.value);
                                        }}
                                        className="font-black text-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Duration</label>
                                        <Input
                                            value={selectedBlueprint.duration}
                                            onChange={(e) => {
                                                const updated = { ...selectedBlueprint, duration: e.target.value };
                                                setSelectedBlueprint(updated);
                                                handleBlueprintChange(selectedBlueprint.id, 'duration', e.target.value);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Projects</label>
                                        <Input
                                            type="number"
                                            value={selectedBlueprint.projects}
                                            onChange={(e) => {
                                                const updated = { ...selectedBlueprint, projects: parseInt(e.target.value) || 0 };
                                                setSelectedBlueprint(updated);
                                                handleBlueprintChange(selectedBlueprint.id, 'projects', parseInt(e.target.value) || 0);
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                                    <textarea
                                        className="w-full min-h-[100px] flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border font-sans"
                                        value={selectedBlueprint.description}
                                        onChange={(e) => {
                                            const updated = { ...selectedBlueprint, description: e.target.value };
                                            setSelectedBlueprint(updated);
                                            handleBlueprintChange(selectedBlueprint.id, 'description', e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-foreground leading-tight">{selectedBlueprint.title}</h2>
                                <div className="flex flex-wrap gap-2 text-sm font-bold">
                                    <span className="px-3 py-1 bg-muted rounded border border-border flex items-center"><Calendar className="w-4 h-4 mr-2" />{selectedBlueprint.duration}</span>
                                    <span className="px-3 py-1 bg-muted rounded border border-border flex items-center"><CheckCircle className="w-4 h-4 mr-2" />{selectedBlueprint.projects} Projects</span>
                                </div>
                                <hr className="border-dashed border-border/50" />
                                <p className="text-lg text-muted-foreground leading-relaxed">{selectedBlueprint.description}</p>
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3 border-t-2 border-border/10 pt-4">
                            {!isEditing && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(true); // Enable edit mode to edit this blueprint
                                    }}
                                >
                                    Edit Details ✏️
                                </Button>
                            )}
                            {isEditing && (
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => {
                                        handleEditToggle(); // Save global state
                                        setSelectedBlueprint(null);
                                    }}
                                >
                                    Save & Close
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


