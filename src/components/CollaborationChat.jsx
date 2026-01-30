import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, User, Clock, Loader2, Bot } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchChatHistory, sendChatMessage } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CollaborationChat = ({ isOpen, onClose, contextId, contextType = 'SHIPMENT' }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef(null);

    const loadHistory = async () => {
        if (!contextId) return;
        setIsLoading(true);
        try {
            const data = await fetchChatHistory(contextId);
            // n8n returns messages in a list
            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load chat history:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && contextId) {
            loadHistory();
        }
    }, [isOpen, contextId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        const messageData = {
            context_id: contextId,
            context_type: contextType,
            sender_name: user?.name || 'Unknown',
            sender_role: user?.role || 'User',
            message: newMessage.trim(),
            timestamp: new Date().toISOString()
        };

        setIsSending(true);
        // Optimistic update
        setMessages(prev => [...prev, messageData]);
        setNewMessage('');

        try {
            await sendChatMessage(messageData);
            // Optionally reload history to sync with backend server-side timestamps/IDs
            // loadHistory(); 
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-[100] border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Collaboration Chat</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{contextId}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                        <Loader2 className="animate-spin" size={24} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Loading History...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50">
                        <Bot size={48} />
                        <p className="text-sm font-medium italic">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_name === user?.name;
                        return (
                            <div key={idx} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                    {!isMe && <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{msg.sender_role}</span>}
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{msg.sender_name}</span>
                                    {isMe && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">You</span>}
                                </div>
                                <div className={clsx(
                                    "max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm",
                                    isMe
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                )}>
                                    {msg.message}
                                </div>
                                <div className="mt-1 px-1 flex items-center gap-1 opacity-40">
                                    <Clock size={10} />
                                    <span className="text-[8px] font-bold">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:outline-none focus:border-blue-600 transition-all"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="absolute right-2 top-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-100"
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
                <p className="mt-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">
                    Secure Channel • PSS Collaboration v1.0
                </p>
            </div>
        </div>
    );
};

export default CollaborationChat;
