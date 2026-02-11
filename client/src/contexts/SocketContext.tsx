import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface SocketContextType {
    socket: Socket | null;
    messageCount: number;
    matchCount: number;
    notifications: any[];
    resetMessageCount: () => void;
    resetMatchCount: () => void;
    clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    messageCount: 0,
    matchCount: 0,
    notifications: [],
    resetMessageCount: () => { },
    resetMatchCount: () => { },
    clearNotifications: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { user, refreshProfile } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messageCount, setMessageCount] = useState(0);
    const [matchCount, setMatchCount] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);

    const addNotification = (notif: any) => {
        setNotifications((prev) => [
            { id: Date.now(), timestamp: new Date(), ...notif },
            ...prev
        ].slice(0, 20)); // Keep last 20
    };

    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:8000");
            setSocket(newSocket);

            newSocket.emit("join_room", { room: user.uid });

            newSocket.on("receive_message", (data: any) => {
                if (data.senderId !== user.uid) {
                    setMessageCount((prev) => prev + 1);
                    const notif = {
                        type: 'message',
                        title: 'New Message',
                        description: data.content,
                        senderId: data.senderId
                    };
                    addNotification(notif);
                    toast.message("New Message", {
                        description: data.content.length > 50 ? data.content.substring(0, 50) + "..." : data.content,
                    });
                }
            });

            newSocket.on("xp_update", (data: any) => {
                addNotification({
                    type: 'xp',
                    title: 'XP Earned!',
                    description: `+${data.amount} XP for ${data.reason || "Dynamic Progress"}`
                });
                toast.success(`+${data.amount} XP Earned!`, {
                    description: data.reason || "Keep up the great work!",
                });
                refreshProfile();
            });

            newSocket.on("level_up", (data: any) => {
                addNotification({
                    type: 'level',
                    title: 'Level Up!',
                    description: `You reached Level ${data.level}! 🚀`
                });
                toast.success("LEVEL UP!", {
                    description: `Congratulations! You've reached Level ${data.level}! 🚀`,
                    style: { background: "var(--primary)", color: "white" }
                });
                refreshProfile();
            });

            newSocket.on("new_match", () => {
                setMatchCount((prev) => prev + 1);
                addNotification({
                    type: 'match',
                    title: "It's a Match! 🎉",
                    description: "You have a new study buddy!"
                });
                toast.success("It's a Match! 🎉", {
                    description: "You have a new study buddy! Check your matches.",
                });
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [user, refreshProfile]);

    const resetMessageCount = () => setMessageCount(0);
    const resetMatchCount = () => setMatchCount(0);
    const clearNotifications = () => setNotifications([]);

    return (
        <SocketContext.Provider value={{
            socket,
            messageCount,
            matchCount,
            notifications,
            resetMessageCount,
            resetMatchCount,
            clearNotifications
        }}>
            {children}
        </SocketContext.Provider>
    );
};
