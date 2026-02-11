import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Send, ChevronLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/contexts/SocketContext";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Messages() {
    const { socket, resetMessageCount } = useSocket();
    const { user: authUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>(authUser?.uid || "");
    const [contacts, setContacts] = useState<any[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Sync with auth user and reset count
    useEffect(() => {
        if (authUser?.uid) {
            setCurrentUserId(authUser.uid);
            resetMessageCount();
        }
    }, [authUser, resetMessageCount]);

    const fetchContacts = async () => {
        if (!currentUserId) return;
        try {
            const { data: contactsData } = await api.get('/messages/contacts');
            setContacts(contactsData);
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    // Fetch contacts
    useEffect(() => {
        fetchContacts();
    }, [currentUserId]);

    // Handle initial chat from URL
    useEffect(() => {
        const userId = searchParams.get("userId");
        if (userId) {
            setActiveChat(userId);
            setShowMobileChat(true);
        }
    }, [searchParams]);

    const fetchHistory = async () => {
        if (!activeChat || !currentUserId) return;
        try {
            setLoadingHistory(true);
            const { data } = await api.get(`/messages/history/${activeChat}`);
            const mappedHistory = data.map((msg: any) => ({
                id: msg.id,
                text: msg.content,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRequest: msg.isRequest || msg.type === "project_invite",
                sessionId: msg.sessionId,
                projectId: msg.projectId,
                type: msg.type,
                sender: msg.senderId === "system" ? "system" : (msg.senderId === currentUserId ? "me" : "them"),
            }));
            setMessages(mappedHistory);
        } catch (error) {
            console.error("Failed to fetch chat history", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Fetch history when active chat changes
    useEffect(() => {
        fetchHistory();
    }, [activeChat, currentUserId]);

    // Global Socket Room for Notifications
    useEffect(() => {
        if (!currentUserId || !socket) return;
        socket.emit("join_room", { room: currentUserId });

        const onReceiveGlobal = (data: any) => {
            if (data.senderId !== currentUserId) {
                fetchContacts();
            }
        };

        socket.on("receive_message", onReceiveGlobal);
        return () => {
            socket.off("receive_message", onReceiveGlobal);
        };
    }, [currentUserId]);

    // Chat-specific Socket Logic
    useEffect(() => {
        if (!activeChat || !currentUserId || !socket) return;

        const room = [currentUserId, activeChat].sort().join("_");
        socket.emit("join_room", { room });

        const onReceiveMessage = (data: any) => {
            // Add to message history if:
            // 1. It's from the other person
            // 2. OR it's a request/invite (even if from me, so I see it)
            // 3. OR it's a system message
            const isRelevantRoom = data.room === room || data.senderId === activeChat;
            const isMe = data.senderId === currentUserId;
            const isRequest = data.isRequest || data.type === "project_invite" || data.type === "match_confirmation";
            const isSystem = data.senderId === "system";

            if (isRelevantRoom && (!isMe || isRequest || isSystem)) {
                setMessages((prev) => {
                    // Prevent duplicate messages if already added locally
                    if (isMe && !isRequest && !isSystem) return prev;

                    return [...prev, {
                        id: Date.now(),
                        sender: isSystem ? "system" : (isMe ? "me" : "them"),
                        text: data.content,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isRequest: isRequest,
                        sessionId: data.sessionId,
                        projectId: data.projectId,
                        type: data.type
                    }];
                });
            }
        };

        socket.on("receive_message", onReceiveMessage);

        return () => {
            socket.off("receive_message", onReceiveMessage);
        };
    }, [activeChat, currentUserId]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !activeChat || !currentUserId) return;

        const room = [currentUserId, activeChat].sort().join("_");
        const messageData = {
            senderId: currentUserId,
            receiverId: activeChat,
            content: messageInput,
            room
        };

        // Emit to server
        if (socket) {
            socket.emit("send_message", messageData);
        }

        // Update local UI immediately
        setMessages((prev) => [...prev, {
            id: Date.now(),
            sender: "me",
            text: messageInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        setMessageInput("");
    };

    const handleAcceptSession = async (sessionId: string) => {
        try {
            await api.put(`/sessions/${sessionId}`, { status: "SCHEDULED" });
            fetchHistory(); // Refresh to update button status if needed
            alert("Session Confirmed! 🗓️ Check your Sessions tab.");
        } catch (error) {
            console.error("Failed to accept session", error);
        }
    };

    const handleAcceptProjectInvite = async (projectId: string) => {
        try {
            await api.post(`/projects/${projectId}/accept-invite`);
            fetchHistory();
            alert("Project Invitation Accepted! 🚀 Check your Projects tab.");
        } catch (error: any) {
            console.error("Failed to accept project invite", error);
            alert(error.response?.data?.detail || "Failed to join project");
        }
    };

    if (!authUser) {
        return (
            <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-card border-2 border-border rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <LogOut className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-black">Authentication Required</h2>
                <p className="text-muted-foreground max-w-sm font-bold">
                    You must be signed in to send or receive messages. Please resolve the login issue to continue.
                </p>
                <Link to="/login">
                    <Button variant="premium">Go to Login</Button>
                </Link>
            </div>
        );
    }

    const activeContact = contacts.find(c => c.id === activeChat);

    return (
        <div className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] bg-card border-2 border-border rounded-2xl overflow-hidden flex animate-fade-in shadow-[4px_4px_0px_0px_var(--sketch-shadow)]">
            {/* Sidebar List */}
            <div className={cn(
                "w-full md:w-80 border-r-2 border-border flex flex-col bg-muted/10",
                showMobileChat ? "hidden md:flex" : "flex"
            )}>
                <div className="p-4 border-b-2 border-border space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search chats..." className="pl-9 bg-background border-2 border-border" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loadingContacts ? (
                        <div className="p-8 text-center text-muted-foreground font-bold italic animate-pulse">Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground font-bold">No chats yet. Start a conversation from the Matches page! 🤝</div>
                    ) : contacts.map(contact => (
                        <div
                            key={contact.id}
                            onClick={() => {
                                setActiveChat(contact.id);
                                setShowMobileChat(true);
                            }}
                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${activeChat === contact.id ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                        >
                            <div className="relative shrink-0">
                                <img src={contact.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-border" alt={contact.name} />
                                {contact.status === "online" && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate">{contact.name}</h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${contact.role === 'Teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {contact.role}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-background",
                !showMobileChat ? "hidden md:flex" : "flex"
            )}>
                {/* Header */}
                <div className="h-16 border-b-2 border-border flex items-center justify-between px-4 sm:px-6 bg-card/50 backdrop-blur-sm">
                    {activeChat ? (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setShowMobileChat(false)}
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                            <img src={activeContact?.avatar} className="w-10 h-10 rounded-full border-2 border-border" />
                            <div>
                                <h3 className="font-black text-sm sm:text-base leading-tight">{activeContact?.name}</h3>
                                <span className="text-[10px] sm:text-xs text-green-500 font-bold flex items-center">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" /> Online
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center font-bold">Select a chat to start messaging</div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/5 font-sans">
                    {loadingHistory ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground font-bold italic animate-pulse">Loading conversation...</div>
                    ) : !activeChat ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 opacity-50">
                            <Send className="w-12 h-12" />
                            <p className="font-bold text-lg">Select a contact to start chatting! 💬</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : msg.sender === "system" ? "justify-center" : "justify-start"}`}>
                                <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 sm:py-3 shadow-sm border-2 border-border ${msg.sender === "me"
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : msg.sender === "system"
                                        ? "bg-muted text-muted-foreground border-dashed text-center italic"
                                        : "bg-card rounded-bl-none"
                                    }`}>
                                    <p className="text-sm sm:text-base font-medium whitespace-pre-wrap">{msg.text.split('[SESSION_ID')[0]}</p>
                                    {msg.isRequest && msg.sender === "them" && (
                                        <div className="mt-3">
                                            {msg.type === "project_invite" ? (
                                                <Button
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                                    onClick={() => handleAcceptProjectInvite(msg.projectId)}
                                                >
                                                    Join Team
                                                </Button>
                                            ) : (
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                                                    onClick={() => handleAcceptSession(msg.sessionId)}
                                                >
                                                    Accept Session
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <p className={`text-[9px] sm:text-[10px] mt-1 text-right ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                        {msg.time}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t-2 border-border bg-card">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Type a message..."
                            className="flex-1 bg-muted/50 border-2 border-transparent focus:border-border font-sans"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <Button
                            size="icon"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-border shadow-[2px_2px_0px_0px_var(--sketch-shadow)]"
                            onClick={handleSendMessage}
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
