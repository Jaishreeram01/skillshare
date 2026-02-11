import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    interests?: string[];
    xp?: number;
    level?: number;
    sessions?: number;
    totalHours?: number;
    trustScore?: number;
    dailyGoalProgress?: number;
    [key: string]: any;
}

interface UserContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

import { useAuth } from './AuthContext';

export function UserProvider({ children }: { children: ReactNode }) {
    const { user: authUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        if (!authUser) return; // Don't fetch if not logged in
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch (err: any) {
            console.error('Error fetching user:', err);
            setError(err.message || 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    useEffect(() => {
        if (authUser) {
            fetchUser();
        } else {
            setLoading(false); // Stop loading if no user
        }
    }, [authUser]);

    return (
        <UserContext.Provider value={{ user, loading, error, refreshUser, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
