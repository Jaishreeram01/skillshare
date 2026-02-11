import { useState, useEffect, Suspense } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import api from "@/services/api";

import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";

const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[4px_4px_0px_0px_var(--sketch-shadow)]"></div>
        <p className="font-handwritten text-xl font-bold animate-pulse text-foreground/70">Sharpening pencils...</p>
    </div>
);

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { refreshProfile } = useAuth();
    const { refreshUser } = useUser(); // Use shared user context

    useEffect(() => {
        // Daily check-in
        const performCheckIn = async () => {
            try {
                const { data } = await api.post('/users/check-in');
                if (data.bonusXp > 0) {
                    // Refresh both auth profile and user context
                    await Promise.all([refreshProfile(), refreshUser()]);
                }
            } catch (error) {
                console.error("Check-in failed", error);
            }
        };
        performCheckIn();
    }, [refreshProfile, refreshUser]);

    return (
        <div className="min-h-screen bg-background flex font-sans selection:bg-primary/20 overflow-x-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300 w-full",
                "lg:ml-64"
            )}>
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in overflow-x-hidden">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
