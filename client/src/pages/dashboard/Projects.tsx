import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, FolderPlus, X, ChevronDown, ChevronUp, Filter } from "lucide-react";
import api from "@/services/api";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Projects() {
    const { user } = useAuth();
    const [activeTechFilter, setActiveTechFilter] = useState("All");
    const [activeTypeFilter, setActiveTypeFilter] = useState("All");
    const [activeDifficultyFilter, setActiveDifficultyFilter] = useState("All");

    const [stagedTechFilter, setStagedTechFilter] = useState("All");
    const [stagedTypeFilter, setStagedTypeFilter] = useState("All");
    const [stagedDifficultyFilter, setStagedDifficultyFilter] = useState("All");

    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const handleApplyFilters = () => {
        setActiveTechFilter(stagedTechFilter);
        setActiveTypeFilter(stagedTypeFilter);
        setActiveDifficultyFilter(stagedDifficultyFilter);
        setShowFilters(false);
    };

    const [projects, setProjects] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]);

    useEffect(() => {
        fetchProjects();
        fetchContacts();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data } = await api.get('/projects');
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
    };

    const fetchContacts = async () => {
        try {
            const { data } = await api.get('/messages/contacts');
            setContacts(data);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        }
    };

    const handleJoinProject = async (projectId: string) => {
        try {
            await api.post(`/projects/${projectId}/join`);
            fetchProjects();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to join project");
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            return;
        }

        try {
            await api.delete(`/projects/${projectId}`);
            fetchProjects();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to delete project");
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesTech = activeTechFilter === "All" || project.stack.includes(activeTechFilter);
        const matchesType = activeTypeFilter === "All" || project.type === activeTypeFilter;
        const matchesDifficulty = activeDifficultyFilter === "All" || project.difficulty === activeDifficultyFilter;
        return matchesTech && matchesType && matchesDifficulty;
    });

    return (
        <div className="space-y-8 animate-fade-in font-handwritten">
            {/* Header omitted for brevity in replace_file_content target content, but keep it in mind */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight -rotate-1">Collaborative Projects 🚀</h1>
                    <p className="text-muted-foreground mt-1 font-bold">Build real-world portfolio pieces with peers.</p>
                </div>
                <Button
                    variant="default"
                    className="sketch-button bg-foreground text-background hover:bg-foreground/90 shadow-[4px_4px_0px_0px_var(--sketch-shadow)]"
                    onClick={() => setShowCreateProjectModal(true)}
                >
                    <FolderPlus className="w-4 h-4 mr-2" /> Create Project
                </Button>
            </div>

            {/* Collapsible Filters */}
            <div className="space-y-4">
                <Button
                    variant="outline"
                    className="w-full md:w-auto font-bold border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)]"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="w-4 h-4 mr-2" /> Filter Projects
                    {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                {showFilters && (
                    <div className="bg-card border-2 border-border rounded-lg p-4 shadow-[2px_2px_0px_0px_var(--sketch-shadow)] animate-in slide-in-from-top">
                        <h3 className="font-bold text-sm mb-3 text-muted-foreground flex justify-between items-center">
                            Filter Projects:
                            {(stagedTechFilter !== "All" || stagedTypeFilter !== "All" || stagedDifficultyFilter !== "All") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs font-black underline"
                                    onClick={() => {
                                        setStagedTechFilter("All");
                                        setStagedTypeFilter("All");
                                        setStagedDifficultyFilter("All");
                                    }}
                                >
                                    Reset
                                </Button>
                            )}
                        </h3>

                        {/* Technology Filter */}
                        <div className="mb-4">
                            <label className="font-bold text-xs mb-2 block text-muted-foreground">Technology:</label>
                            <div className="flex flex-wrap gap-2">
                                {["All", "React", "Node.js", "Python", "TypeScript", "Next.js", "Express"].map((tech) => (
                                    <button
                                        key={tech}
                                        onClick={() => setStagedTechFilter(tech)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-2 border-border ${stagedTechFilter === tech
                                            ? "bg-blue-500 text-white shadow-[2px_2px_0px_0px_var(--sketch-shadow)]"
                                            : "bg-card text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {tech}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Project Type Filter */}
                        <div className="mb-4">
                            <label className="font-bold text-xs mb-2 block text-muted-foreground">Project Type:</label>
                            <div className="flex flex-wrap gap-2">
                                {["All", "Web App", "Mobile App", "API", "CLI Tool", "Game"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setStagedTypeFilter(type)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-2 border-border ${stagedTypeFilter === type
                                            ? "bg-green-500 text-white shadow-[2px_2px_0px_0px_var(--sketch-shadow)]"
                                            : "bg-card text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty Filter */}
                        <div className="mb-6">
                            <label className="font-bold text-xs mb-2 block text-muted-foreground">Difficulty:</label>
                            <div className="flex flex-wrap gap-2">
                                {["All", "Beginner", "Intermediate", "Advanced"].map((diff) => (
                                    <button
                                        key={diff}
                                        onClick={() => setStagedDifficultyFilter(diff)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-2 border-border ${stagedDifficultyFilter === diff
                                            ? "bg-yellow-500 text-black shadow-[2px_2px_0px_0px_var(--sketch-shadow)]"
                                            : "bg-card text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full sketch-button bg-foreground text-background font-black shadow-[3px_3px_0px_0px_var(--sketch-shadow)] hover:bg-foreground/90 transition-all active:translate-y-0.5 active:shadow-none"
                            onClick={handleApplyFilters}
                        >
                            Apply Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredProjects.map((project, i) => (
                    <div key={project.id} className={`group relative bg-card rounded-none border-2 border-border p-5 sm:p-6 hover:translate-y-1 transition-all duration-300 flex flex-col h-full shadow-[4px_4px_0px_0px_var(--sketch-shadow)] ${i % 2 !== 0 ? 'md:rotate-1' : 'md:-rotate-1'} hover:rotate-0`}>
                        {/* Tape effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-muted/50 backdrop-blur-sm border border-border rotate-1 shadow-sm opacity-80" />

                        <div className="flex justify-between items-start mb-4">
                            {project.repo ? (
                                <a href={`https://github.com/${project.repo}`} target="_blank" rel="noopener noreferrer">
                                    <div className="p-3 bg-muted rounded-lg border-2 border-border group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 transition-colors cursor-pointer">
                                        <Github className="w-6 h-6 text-foreground" />
                                    </div>
                                </a>
                            ) : (
                                <div className="p-3 bg-muted rounded-lg border-2 border-border">
                                    <Github className="w-6 h-6 text-foreground opacity-50" />
                                </div>
                            )}
                            {project.spots > 0 ? (
                                <span className="bg-green-100 text-black border-2 border-border px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_var(--sketch-shadow)]">
                                    {project.spots} Spots Left
                                </span>
                            ) : (
                                <span className="bg-red-100 text-black border-2 border-border px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_var(--sketch-shadow)]">
                                    Full
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-black mb-2 text-foreground underline decoration-wavy decoration-2 decoration-transparent group-hover:decoration-yellow-400 transition-all">{project.title}</h3>
                        <p className="text-muted-foreground text-sm mb-6 flex-1 font-bold leading-relaxed font-sans">{project.description}</p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {project.stack.map((tech: string) => (
                                <span key={tech} className="px-2.5 py-1 bg-card text-foreground text-xs font-bold border-2 border-border shadow-[1px_1px_0px_0px_var(--sketch-shadow)]">
                                    {tech}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto space-y-4">
                            <div className="flex items-center justify-between text-sm text-muted-foreground font-bold font-sans">
                                <div className="flex -space-x-2 overflow-hidden">
                                    {(project.memberDetails || []).map((m: any) => (
                                        <img
                                            key={m.id}
                                            src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`}
                                            alt={m.name}
                                            title={m.name}
                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-background border-2 border-border object-cover"
                                        />
                                    ))}
                                    {project.spots > 0 && (
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-dashed border-border text-[10px] font-black" title={`${project.spots} spots available`}>
                                            +{project.spots}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center text-orange-600">
                                    <span className="font-black mr-1 text-lg">{project.streak}</span>
                                    <span>Day Streak 🔥</span>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-lg border-2 border-border font-bold hover:bg-muted shadow-[2px_2px_0px_0px_var(--sketch-shadow)] transition-all active:translate-y-0.5 active:shadow-none bg-card text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (project.repo) {
                                            if (project.repo.startsWith('http')) {
                                                window.open(project.repo, '_blank');
                                            } else {
                                                window.open(`https://github.com/${project.repo}`, '_blank');
                                            }
                                        } else {
                                            alert("No link provided for this project.");
                                        }
                                    }}
                                >
                                    View Project
                                </Button>

                                {/* Show Join button for non-owners, Delete button for owner */}
                                {user && project.ownerId === user.uid ? (
                                    <Button
                                        variant="destructive"
                                        className="flex-1 rounded-lg border-2 border-border font-bold shadow-[3px_3px_0px_0px_var(--sketch-shadow)] transition-all active:translate-y-0.5 active:shadow-none bg-red-500 hover:bg-red-600 text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id);
                                        }}
                                    >
                                        Delete Project
                                    </Button>
                                ) : (
                                    <Button
                                        className="flex-1 rounded-lg sketch-button bg-foreground text-background hover:bg-foreground/90 font-black shadow-[3px_3px_0px_0px_var(--sketch-shadow)] transition-all active:translate-y-0.5 active:shadow-none"
                                        disabled={project.spots === 0 || (project.memberIds && user && project.memberIds.includes(user.uid))}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleJoinProject(project.id);
                                        }}
                                    >
                                        {project.spots > 0 ? (
                                            (project.memberIds && user && project.memberIds.includes(user.uid)) ? "Joined" : "Join Project"
                                        ) : (
                                            "Full"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Call to action card */}
                <div className="border-2 border-dashed border-border hover:border-foreground hover:bg-muted/30 transition-all p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px] cursor-pointer group rounded-xl">
                    <div className="p-4 bg-card rounded-full border-2 border-border shadow-[3px_3px_0px_0px_var(--sketch-shadow)] group-hover:rotate-12 transition-transform">
                        <FolderPlus className="w-8 h-8 text-foreground" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground">Have an idea? 💡</h3>
                        <p className="text-muted-foreground text-sm max-w-[200px] mx-auto mt-1 font-bold">Start your own project and recruit the perfect team.</p>
                    </div>
                    <Button variant="outline" className="border-2 border-border font-bold hover:bg-card">Initialize Repo</Button>
                </div>
            </div>

            {/* Create Project Modal */}
            {showCreateProjectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border-2 border-border shadow-[8px_8px_0px_0px_var(--sketch-shadow)] p-6 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 rounded-full hover:bg-muted"
                            onClick={() => setShowCreateProjectModal(false)}
                        >
                            <X className="w-5 h-5" />
                        </Button>

                        <h2 className="text-2xl font-black mb-6">Create New Project</h2>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const selectedMemberIds = Array.from(formData.getAll("memberIds")) as string[];

                            const newProject = {
                                title: formData.get("title"),
                                description: formData.get("description"),
                                stack: (formData.get("stack") as string).split(',').map(s => s.trim()),
                                type: formData.get("type"),
                                difficulty: formData.get("difficulty"),
                                spots: 1, // Placeholder, backend recalculates
                                totalSpots: parseInt(formData.get("totalSpots") as string) || 4,
                                repo: formData.get("repo"),
                                memberIds: selectedMemberIds,
                                ownerId: "temp",
                                ownerName: "temp"
                            };

                            try {
                                await api.post('/projects', newProject);
                                setShowCreateProjectModal(false);
                                fetchProjects();
                            } catch (error) {
                                console.error("Failed to create project", error);
                            }
                        }}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-sm mb-2 block">Project Name</label>
                                        <Input name="title" required placeholder="e.g., E-commerce Platform" className="border-2 border-border font-sans" />
                                    </div>

                                    <div>
                                        <label className="font-bold text-sm mb-2 block">Project Type</label>
                                        <select name="type" className="w-full h-10 px-3 border-2 border-border rounded-md font-sans font-bold bg-background">
                                            <option>Web App</option>
                                            <option>Mobile App</option>
                                            <option>API</option>
                                            <option>CLI Tool</option>
                                            <option>Game</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-sm mb-2 block">Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        placeholder="What is your project about? What problem does it solve?"
                                        className="w-full min-h-[100px] p-3 border-2 border-border rounded-lg font-sans resize-none text-black bg-background"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-sm mb-2 block">Tech Stack (comma separated)</label>
                                        <Input name="stack" required placeholder="e.g., React, Node.js, MongoDB" className="border-2 border-border font-sans" />
                                    </div>

                                    <div>
                                        <label className="font-bold text-sm mb-2 block">Difficulty Level</label>
                                        <select name="difficulty" className="w-full h-10 px-3 border-2 border-border rounded-md font-sans font-bold bg-background">
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="font-bold text-sm mb-2 block">Team Size</label>
                                        <Input name="totalSpots" type="number" placeholder="4" className="border-2 border-border font-sans" />
                                    </div>

                                    <div>
                                        <label className="font-bold text-sm mb-2 block">GitHub Repository (optional)</label>
                                        <Input name="repo" placeholder="username/repo" className="border-2 border-border font-sans" />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-sm mb-2 block">Add Members (Mutual Contacts only)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-3 border-2 border-border rounded-lg bg-muted/30">
                                        {contacts.length === 0 ? (
                                            <p className="text-xs text-muted-foreground font-bold italic col-span-2">No mutual contacts found. Message someone first!</p>
                                        ) : (
                                            contacts.map((contact) => (
                                                <div key={contact.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`contact-${contact.id}`}
                                                        name="memberIds"
                                                        value={contact.id}
                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                    <label htmlFor={`contact-${contact.id}`} className="flex items-center gap-2 cursor-pointer">
                                                        <img src={contact.avatar} alt="" className="w-6 h-6 rounded-full border border-border" />
                                                        <span className="text-xs font-bold">{contact.name}</span>
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="font-bold text-sm mb-2 block">Looking For (roles needed)</label>
                                    <Input name="lookingFor" placeholder="e.g., Frontend Developer, UI Designer" className="border-2 border-border font-sans" />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 font-bold border-2 border-border"
                                        onClick={() => setShowCreateProjectModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 font-bold bg-foreground text-background hover:bg-foreground/90 shadow-[3px_3px_0px_0px_var(--sketch-shadow)] transition-all active:translate-y-1 active:shadow-none"
                                    >
                                        Create Project
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
