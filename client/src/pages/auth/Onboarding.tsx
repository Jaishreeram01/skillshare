import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

interface WizardStep {
    id: string;
    question: string;
    description?: string;
    type: "text" | "select" | "multi-select" | "blueprint";
    options?: string[];
    placeholder?: string;
}

const steps: WizardStep[] = [
    {
        id: "name",
        question: "What's your name?",
        description: "Let's get to know each other.",
        type: "text",
        placeholder: "e.g. Alex Chen",
    },
    {
        id: "role",
        question: "Do you want to Teach or Learn?",
        description: "You can do both later!",
        type: "select",
        options: ["I want to Learn 🎓", "I want to Teach 🧑‍🏫", "Both 🚀"],
    },
    {
        id: "skills_teach",
        question: "What can you teach?",
        description: "Select your strongest skills (Max 3).",
        type: "multi-select",
        options: ["React", "Node.js", "Python", "Design", "Marketing", "Three.js"],
    },
    {
        id: "skills_learn",
        question: "What do you want to learn?",
        description: "What's your next goal?",
        type: "multi-select",
        options: ["React", "Node.js", "Python", "Design", "Marketing", "Three.js"],
    },
    {
        id: "teachingBlueprint",
        question: "Your Teaching Blueprint",
        description: "Describe your unique methodology.",
        type: "blueprint",
    },
];

export default function OnboardingWizard() {
    const { user: authUser } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customSkill, setCustomSkill] = useState("");

    const step = steps[currentStep];

    const handleNext = async () => {
        setIsAddingCustom(false);
        setCustomSkill("");
        if (currentStep < steps.length - 1) {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        } else {
            console.log("Submit", formData);
            try {
                if (!authUser) throw new Error("Not authenticated");

                const payload = {
                    email: authUser.email,
                    name: formData.name,
                    skills: formData.skills_teach || [],
                    learning: formData.skills_learn || [],
                    teachingBlueprint: formData.teachingBlueprint || {},
                    bio: formData.teachingBlueprint?.approach || `Interested in ${formData.role}`,
                    // Defaults
                    xp: 0,
                    level: 1,
                    isVerified: false
                };

                await api.post("/users/", payload);
                navigate("/dashboard");
            } catch (error) {
                console.error("Failed to save onboarding data", error);
                // Optionally show error to user
            }
        }
    };

    const handleBack = () => {
        setIsAddingCustom(false);
        setCustomSkill("");
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const updateField = (value: any) => {
        setFormData((prev) => ({ ...prev, [step.id]: value }));
    };

    const toggleSelection = (option: string) => {
        const current = formData[step.id] || [];
        if (current.includes(option)) {
            updateField(current.filter((i: string) => i !== option));
        } else {
            if (current.length < 3) {
                updateField([...current, option]);
            }
        }
    };

    const addCustomSkill = () => {
        if (customSkill.trim()) {
            const current = formData[step.id] || [];
            if (!current.includes(customSkill.trim()) && current.length < 3) {
                updateField([...current, customSkill.trim()]);
            }
            setCustomSkill("");
            setIsAddingCustom(false);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-lg">
                {/* Progress Bar */}
                <div className="mb-8 flex space-x-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 flex-1 rounded-full transition-all duration-500",
                                i <= currentStep ? "bg-primary" : "bg-muted"
                            )}
                        />
                    ))}
                </div>

                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="space-y-6"
                    >
                        <div className="space-y-2 text-center">
                            <h2 className="text-3xl font-bold tracking-tight">{step.question}</h2>
                            <p className="text-muted-foreground text-lg">{step.description}</p>
                        </div>

                        <div className="min-h-[200px] flex flex-col justify-center">
                            {step.type === "text" && (
                                <Input
                                    autoFocus
                                    placeholder={step.placeholder}
                                    className="text-lg p-6 h-14 shadow-sm"
                                    value={formData[step.id] || ""}
                                    onChange={(e) => updateField(e.target.value)}
                                />
                            )}

                            {step.type === "select" && (
                                <div className="grid gap-3">
                                    {step.options?.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => updateField(option)}
                                            className={cn(
                                                "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                                                formData[step.id] === option
                                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                                                    : "border-muted hover:border-primary/50 hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-lg">{option}</span>
                                                {formData[step.id] === option && (
                                                    <Check className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step.type === "multi-select" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {step.options?.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => toggleSelection(option)}
                                                className={cn(
                                                    "text-left p-4 rounded-xl border-2 transition-all duration-200",
                                                    (formData[step.id] || []).includes(option)
                                                        ? "border-primary bg-primary/5 shadow-md"
                                                        : "border-muted hover:border-primary/50 hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{option}</span>
                                                    {(formData[step.id] || []).includes(option) && (
                                                        <Check className="w-4 h-4 text-primary" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                        {!isAddingCustom && (
                                            <button
                                                onClick={() => setIsAddingCustom(true)}
                                                className="text-left p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50 transition-all duration-200 flex items-center justify-center italic text-muted-foreground font-medium"
                                            >
                                                Other +
                                            </button>
                                        )}
                                    </div>

                                    {isAddingCustom && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex space-x-2"
                                        >
                                            <Input
                                                autoFocus
                                                placeholder="Type another skill..."
                                                value={customSkill}
                                                onChange={(e) => setCustomSkill(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                                                className="flex-1"
                                            />
                                            <Button onClick={addCustomSkill}>Add</Button>
                                            <Button variant="ghost" onClick={() => setIsAddingCustom(false)}>Cancel</Button>
                                        </motion.div>
                                    )}

                                    {/* Display custom skills already added but not in fixed options */}
                                    <div className="flex flex-wrap gap-2">
                                        {(formData[step.id] || []).filter((s: string) => !step.options?.includes(s)).map((s: string) => (
                                            <div key={s} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20 flex items-center overflow-hidden">
                                                <span className="truncate max-w-[150px]">{s}</span>
                                                <button onClick={() => toggleSelection(s)} className="ml-2 hover:text-red-500 flex-shrink-0 transition-colors">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step.type === "blueprint" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">How you teach</label>
                                        <textarea
                                            className="w-full bg-card/50 border-2 border-muted p-4 rounded-xl focus:border-primary outline-none transition-all min-h-[100px] font-sans ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. I focus on project-based learning and first principles..."
                                            value={formData.teachingBlueprint?.approach || ""}
                                            onChange={(e) => updateField({ ...formData.teachingBlueprint, approach: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">What makes you different</label>
                                        <textarea
                                            className="w-full bg-card/50 border-2 border-muted p-4 rounded-xl focus:border-primary outline-none transition-all min-h-[100px] font-sans ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="e.g. 5+ years of industry experience at top tech firms..."
                                            value={formData.teachingBlueprint?.differentiation || ""}
                                            onChange={(e) => updateField({ ...formData.teachingBlueprint, differentiation: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={currentStep === 0 ? "opacity-0" : "opacity-100"}
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" /> Back
                    </Button>
                    <Button
                        size="lg"
                        variant="premium"
                        onClick={handleNext}
                        disabled={
                            step.type === "blueprint"
                                ? (!formData[step.id]?.approach && !formData[step.id]?.differentiation)
                                : (!formData[step.id] || (Array.isArray(formData[step.id]) && formData[step.id].length === 0))
                        }
                        className="px-8"
                    >
                        {currentStep === steps.length - 1 ? "Finish" : "Next"} <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
