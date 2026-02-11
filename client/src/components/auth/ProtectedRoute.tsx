import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[4px_4px_0px_0px_var(--sketch-shadow)]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-full animate-ping"></div>
                    </div>
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">Welcome Back</h2>
                    <p className="font-handwritten text-xl font-bold animate-pulse text-muted-foreground">Verifying credentials...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
