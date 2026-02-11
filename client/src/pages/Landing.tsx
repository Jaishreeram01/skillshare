import { Button } from "@/components/ui/button";
import { Zap, CheckCircle, ArrowRight, Star } from "lucide-react";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col bg-background overflow-hidden relative font-sans selection:bg-accent selection:text-accent-foreground">
            {/* Soft Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[100px] mix-blend-multiply opacity-70" />
            </div>

            {/* Navigation */}
            <nav className="container mx-auto px-6 py-6 flex justify-between items-center z-50">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-slate-800">
                        Skill<span className="text-primary">Share</span>
                    </span>
                </div>
                <div className="hidden md:flex items-center space-x-8 font-medium text-slate-600">
                    <a href="#features" className="hover:text-primary transition-colors">How it Works</a>
                    <a href="#testimonials" className="hover:text-primary transition-colors">Stories</a>
                    <div className="flex items-center space-x-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-slate-600 hover:text-primary hover:bg-blue-50">Log in</Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="premium" size="lg" className="px-8 shadow-blue-500/20">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 container mx-auto px-6 flex flex-col lg:flex-row items-center justify-center pt-12 pb-20 gap-16">
                <div className="lg:w-1/2 space-y-8 text-center lg:text-left z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6 border border-blue-100">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-sm font-semibold text-blue-700">New: AI Learning Paths</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-slate-900">
                            Learn faster by <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                teaching others.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                            Connect with peers who want to learn what you know, and teach what you need.
                            Structured paths, verified skills, and real growth.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                    >
                        <Link to="/register" className="w-full sm:w-auto">
                            <Button variant="premium" size="xl" className="w-full shadow-xl shadow-blue-500/20">
                                Start My Journey <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Button variant="learning" size="xl" className="w-full sm:w-auto bg-white">
                            Explore Skills
                        </Button>
                    </motion.div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start space-x-8 text-slate-500 text-sm font-medium">
                        <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Free to join</div>
                        <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Verified Community</div>
                        <div className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> AI-Powered Matching</div>
                    </div>
                </div>

                {/* Hero Visual - Clean Cards */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7 }}
                    className="lg:w-1/2 relative w-full flex items-center justify-center"
                >
                    {/* Main Card */}
                    <div className="relative bg-white p-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 z-20 max-w-sm w-full">
                        <div className="flex items-center space-x-4 mb-6">
                            <img src="https://i.pravatar.cc/150?u=a" className="w-14 h-14 rounded-full border-4 border-white shadow-sm" />
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Sarah Jenkins</h3>
                                <p className="text-sm text-slate-500">UX Designer • 4.9 <Star className="w-3 h-3 inline text-yellow-400 fill-yellow-400" /></p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Teaching</p>
                                <p className="font-semibold text-slate-700">Figma Prototyping</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Learning</p>
                                <p className="font-semibold text-blue-700">React Components</p>
                            </div>
                        </div>

                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-12">
                            Connect with Sarah
                        </Button>

                        {/* Floating Match Badge */}
                        <div className="absolute -top-6 -right-6 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 animate-bounce duration-[3000ms]">
                            <div className="flex items-center space-x-2">
                                <div className="bg-green-100 p-1.5 rounded-full">
                                    <Zap className="w-4 h-4 text-green-600 fill-green-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Match Score</p>
                                    <p className="text-sm font-bold text-slate-800">98% Compatible</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Card Decorative */}
                    <div className="absolute top-12 -right-4 w-full h-full bg-slate-50 rounded-3xl -z-10 rotate-3 border border-slate-100" />
                </motion.div>
            </main>        </div>
    );
}
