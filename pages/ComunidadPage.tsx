
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { User, GamificationAction, CommunityMessage, Page, UserRole } from '../types';

// --- Types ---
interface Channel {
    id: number;
    name: string;
    description: string;
    admin_only_write?: boolean;
    unreadCount?: number;
}
interface Member {
    id: string; 
    name: string;
    profile_picture_url: string | null;
    is_admin: boolean;
    is_online: boolean;
}

type MessagesState = Record<number, CommunityMessage[]>;
type RenderableChatItem = { type: 'message_group'; group: CommunityMessage[] } | { type: 'date_divider'; date: Date };

// --- Helper Functions ---
const getUserInitials = (name: string): string => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const userColors = ['bg-red-200 text-red-800', 'bg-orange-200 text-orange-800', 'bg-amber-200 text-amber-800', 'bg-yellow-200 text-yellow-800', 'bg-lime-200 text-lime-800', 'bg-green-200 text-green-800', 'bg-emerald-200 text-emerald-800', 'bg-teal-200 text-teal-800', 'bg-cyan-200 text-cyan-800', 'bg-sky-200 text-sky-800', 'bg-blue-200 text-blue-800', 'bg-indigo-200 text-indigo-800', 'bg-violet-200 text-violet-800', 'bg-purple-200 text-purple-800', 'bg-fuchsia-200 text-fuchsia-800', 'bg-pink-200 text-pink-800', 'bg-rose-200 text-rose-800'];
const colorCache: Record<string, string> = {};
const getConsistentColor = (name: string) => {
    if (colorCache[name]) return colorCache[name];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = userColors[Math.abs(hash % userColors.length)];
    colorCache[name] = color;
    return color;
};
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// --- Sub-Components ---
const CreateChannelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (channel: { name: string; description: string; admin_only_write: boolean }) => Promise<void>;
}> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [adminOnly, setAdminOnly] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
            setAdminOnly(false);
            setIsCreating(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        await onCreate({ name, description, admin_only_write: adminOnly });
        setIsCreating(false);
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content !max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-xl font-bold font-display text-text-main mb-4">Crear Nuevo Canal</h2>
                    <div className="space-y-4 modal-form">
                        <div>
                            <label htmlFor="channel-name">Nombre del Canal (sin #)</label>
                            <input type="text" id="channel-name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label htmlFor="channel-desc">Descripción</label>
                            <input type="text" id="channel-desc" value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>
                        <div>
                            <label className="custom-toggle-label">
                                <input type="checkbox" className="custom-toggle-input" checked={adminOnly} onChange={e => setAdminOnly(e.target.checked)} />
                                <div className="custom-toggle-track"><div className="custom-toggle-thumb"></div></div>
                                <span className="ml-3 text-sm text-text-secondary">Solo los administradores pueden escribir</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-600 text-slate-100 rounded-md hover:bg-slate-500">Cancelar</button>
                        <button type="submit" disabled={isCreating} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-slate-500">
                            {isCreating ? 'Creando...' : 'Crear Canal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const DateDivider: React.FC<{ date: Date }> = ({ date }) => (
    <div className="discord-date-divider"><span>{new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date)}</span></div>
);

const MessageItem: React.FC<{
    message: CommunityMessage; isGroupStart: boolean; user: User | null; isAdmin: boolean;
    setReplyingTo: (msg: CommunityMessage | null) => void;
    setEditingMessage: (msg: CommunityMessage | null) => void;
    onDelete: (messageId: number) => void;
    onToggleReaction: (messageId: number, emoji: string) => void;
    onViewProfile: (userId: string) => void;
}> = ({ message, isGroupStart, user, isAdmin, setReplyingTo, setEditingMessage, onDelete, onToggleReaction, onViewProfile }) => {
    const [hovered, setHovered] = useState(false);
    const canInteract = user?.id === message.user_id || isAdmin;
    
    return (
        <div className={`discord-message-item ${isGroupStart ? 'mt-4' : ''}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {isGroupStart && (
                <div className="discord-message-avatar cursor-pointer" onClick={() => onViewProfile(message.user_id)}>
                    {message.avatarUrl ? <img src={message.avatarUrl} alt={message.user} className="w-10 h-10 rounded-full object-cover" />
                    : <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getConsistentColor(message.user)}`}>{getUserInitials(message.user)}</div>}
                </div>
            )}
            
            <div className="flex flex-col">
                {message.replyingTo && (
                    <div className="discord-reply-container">
                        <div className="discord-reply-line"></div>
                        <span className="discord-reply-user mr-1">{message.replyingTo.user}</span>
                        <span className="discord-reply-content">{message.replyingTo.text}</span>
                    </div>
                )}

                {isGroupStart && (
                    <div className="flex items-baseline space-x-2">
                        <span className="font-semibold text-[color:var(--header-primary)] cursor-pointer hover:underline" onClick={() => onViewProfile(message.user_id)}>{message.user}</span>
                        {message.userRole && (message.userRole === 'dueño' || message.userRole === 'moderador') && (
                            <span className="discord-admin-tag">ADMIN</span>
                        )}
                        {message.userTitle && (
                            <span className="text-xs text-primary font-semibold">{message.userTitle}</span>
                        )}
                        <span className="text-xs text-[color:var(--text-muted)]">{new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.timestamp))}</span>
                    </div>
                )}
                
                <p className="text-[color:var(--text-normal)] whitespace-pre-wrap">{message.text}{!!message.edited && <span className="text-xs text-[color:var(--text-muted)] ml-1">(editado)</span>}</p>

                {message.imageUrl && <img src={message.imageUrl} alt="Imagen adjunta" className="mt-2 max-w-xs rounded-lg" />}
                
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                     <div className="discord-reactions-bar">
                        {Object.entries(message.reactions).map(([emoji, users]) => (
                            <button key={emoji} onClick={() => onToggleReaction(message.id, emoji)}
                                className={`reaction-pill ${(users as string[]).includes(user?.name ?? '') ? 'reacted-by-user' : ''}`}>
                                <span className="emoji">{emoji}</span>
                                <span className="count">{(users as string[]).length}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {hovered && user && (
                <div className="discord-message-toolbar">
                    <button className="discord-toolbar-button" onClick={() => onToggleReaction(message.id, '👍')} title="Reaccionar">👍</button>
                    <button className="discord-toolbar-button" onClick={() => setReplyingTo(message)} title="Responder">💬</button>
                    {user?.id === message.user_id && <button onClick={() => setEditingMessage(message)} className="discord-toolbar-button" title="Editar">✏️</button>}
                    {canInteract && <button onClick={() => onDelete(message.id)} className="discord-toolbar-button" title="Eliminar">🗑️</button>}
                </div>
            )}
        </div>
    );
};

// --- Main Component ---
const ComunidadPage: React.FC<{ user: User | null; onUserAction: (action: GamificationAction, payload?: any) => void; onNewMessage: () => void; onViewProfile: (userId: string) => void; }> = ({ user, onUserAction, onNewMessage, onViewProfile }) => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
    const [messages, setMessages] = useState<MessagesState>({});
    const [newMessage, setNewMessage] = useState('');
    const [imageToSend, setImageToSend] = useState<{ file: File, preview: string } | null>(null);
    const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
    const [editingMessage, setEditingMessage] = useState<CommunityMessage | null>(null);
    const [editedText, setEditedText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isChannelsOpen, setIsChannelsOpen] = useState(false);
    const [isMembersOpen, setIsMembersOpen] = useState(false);
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [scrollToMessage, setScrollToMessage] = useState<number | null>(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    
    const mentionStartPosition = useRef<number | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const isAdmin = user?.role === 'dueño' || user?.role === 'moderador';

    const fetchChannels = useCallback(async () => {
        try {
            const url = user ? `http://localhost:3001/api/community/channels?userId=${user.id}` : 'http://localhost:3001/api/community/channels';
            const response = await fetch(url);
            const data = await response.json();
            setChannels(data);
            if (data.length > 0 && !activeChannelId) {
                setActiveChannelId(data[0].id);
            } else if (data.length === 0) {
                setActiveChannelId(null);
            }
        } catch (error) { console.error("Error fetching channels:", error); }
    }, [user, activeChannelId]);

    const fetchMembers = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/community/members');
            const data = await response.json();
            setMembers(data);
        } catch (error) { console.error("Error fetching members:", error); }
    }, []);

    const fetchMessages = useCallback(async (channelId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/community/messages/${channelId}`);
            const data = await response.json();
            setMessages(prev => ({ ...prev, [channelId]: data }));
        } catch (error) { console.error("Error fetching messages:", error); } finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        fetchChannels();
        fetchMembers();
        const memberInterval = setInterval(fetchMembers, 30000); // Fetch members every 30 seconds for online status
        return () => clearInterval(memberInterval);
    }, [fetchChannels, fetchMembers]);

    useEffect(() => {
        const navContextStr = sessionStorage.getItem('navigateToCommunity');
        if (navContextStr) {
            sessionStorage.removeItem('navigateToCommunity');
            try {
                const context = JSON.parse(navContextStr);
                if (context.channelId) {
                    setActiveChannelId(context.channelId);
                    if (context.messageId) {
                        setScrollToMessage(context.messageId);
                    }
                }
            } catch (e) {
                console.error("Failed to parse navigation context", e);
            }
        }
    }, []);

    useEffect(() => {
        if (activeChannelId) {
            fetchMessages(activeChannelId);
        }
    }, [activeChannelId, fetchMessages]);

    useEffect(() => {
        if (isLoading) return;
        const chatContainer = chatContainerRef.current;
        if (chatContainer && !scrollToMessage) {
            setTimeout(() => { chatContainer.scrollTop = chatContainer.scrollHeight }, 100);
        }
    }, [messages, activeChannelId, isLoading, scrollToMessage]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [newMessage, editedText]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !imageToSend) || !user || activeChannelId === null) return;
        
        let imageUrl: string | null = null;
        if (imageToSend) {
            imageUrl = await fileToBase64(imageToSend.file);
        }

        try {
            await fetch('http://localhost:3001/api/community/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: activeChannelId,
                    userId: user.id,
                    content: newMessage.trim(),
                    replyingToId: replyingTo?.id || null,
                    imageUrl: imageUrl,
                }),
            });
            setNewMessage('');
            setImageToSend(null);
            setReplyingTo(null);
            onUserAction('send_message');
            fetchMessages(activeChannelId);
            onNewMessage(); // Refresh global unread counts
        } catch (error) { console.error("Error sending message:", error); }
    };
    
    const handleEditMessage = async () => {
        if (!editedText.trim() || !editingMessage || !user || activeChannelId === null) return;
        try {
            await fetch(`http://localhost:3001/api/community/messages/${editingMessage.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editedText.trim(), userId: user.id, userRole: user.role }),
            });
            setEditingMessage(null);
            setEditedText('');
            fetchMessages(activeChannelId);
        } catch (error) { console.error("Error editing message:", error); }
    };

    const handleDeleteMessage = async (messageId: number) => {
        if (!user || !window.confirm("¿Seguro que quieres eliminar este mensaje?") || activeChannelId === null) return;
        try {
            await fetch(`http://localhost:3001/api/community/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, userRole: user.role }),
            });
            fetchMessages(activeChannelId);
        } catch (error) { console.error("Error deleting message:", error); }
    };

    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (!user || activeChannelId === null) return;
        try {
            await fetch(`http://localhost:3001/api/community/messages/${messageId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: user.name, emoji }),
            });
            fetchMessages(activeChannelId);
        } catch (error) { console.error("Error toggling reaction:", error); }
    };

     const handleCreateChannel = async (channelData: { name: string; description: string; admin_only_write: boolean }) => {
        if (!isAdmin || !user) return;
        try {
            const response = await fetch('http://localhost:3001/api/community/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...channelData, userId: user.id, userRole: user.role }),
            });
            if (!response.ok) throw new Error('Error al crear el canal.');
            const newChannel = await response.json();
            await fetchChannels();
            setActiveChannelId(newChannel.id);
        } catch (error) {
            console.error(error);
            alert("No se pudo crear el canal.");
        }
    };
    
    const handleDeleteChannel = async (channelId: number) => {
        if (!isAdmin || !user) return;
        if (window.confirm("¿Estás seguro de que quieres eliminar este canal? Todos los mensajes se borrarán permanentemente.")) {
            try {
                const response = await fetch(`http://localhost:3001/api/community/channels/${channelId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, userRole: user.role }),
                });
                if (!response.ok) throw new Error('Error al eliminar el canal.');
                await fetchChannels();
            } catch (error) {
                console.error(error);
                alert("No se pudo eliminar el canal.");
            }
        }
    };

    useEffect(() => { if (editingMessage) setEditedText(editingMessage.text); }, [editingMessage]);

    const renderableChatItems = useMemo(() => {
        const channelMessages = activeChannelId ? messages[activeChannelId] || [] : [];
        if (channelMessages.length === 0) return [];
        const items: RenderableChatItem[] = [];
        let lastMessage: CommunityMessage | null = null;
        channelMessages.forEach(message => {
            const messageDate = new Date(message.timestamp);
            const lastMessageDate = lastMessage ? new Date(lastMessage.timestamp) : null;
            if (!lastMessageDate || messageDate.toDateString() !== lastMessageDate.toDateString()) {
                items.push({ type: 'date_divider', date: messageDate });
            }
            if (lastMessage && items.length > 0 && items[items.length - 1].type === 'message_group' &&
                message.user === lastMessage.user && !message.replyingTo && !lastMessage.replyingTo &&
                messageDate.getTime() - lastMessageDate!.getTime() < 5 * 60 * 1000
            ) {
                (items[items.length - 1] as any).group.push(message);
            } else {
                items.push({ type: 'message_group', group: [message] });
            }
            lastMessage = message;
        });
        return items;
    }, [messages, activeChannelId]);

    useEffect(() => {
        if (scrollToMessage && renderableChatItems.length > 0 && !isLoading) {
            for (const item of renderableChatItems) {
                if (item.type === 'message_group' && item.group.some(msg => msg.id === scrollToMessage)) {
                    const elementId = `message-group-${item.group[0].id}`;
                    const element = document.getElementById(elementId);
                    
                    if (element) {
                        setTimeout(() => {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.classList.add('highlight');
                            setTimeout(() => {
                                element.classList.remove('highlight');
                            }, 2500);
                            setScrollToMessage(null);
                        }, 100);
                    }
                    break;
                }
            }
        }
    }, [renderableChatItems, scrollToMessage, isLoading]);

    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursorPosition = e.target.selectionStart;

        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');
        const lastSpaceAfterAt = textBeforeCursor.indexOf(' ', lastAt);

        if (lastAt !== -1 && (lastSpaceAfterAt === -1 || lastSpaceAfterAt < lastAt)) {
            const query = textBeforeCursor.substring(lastAt + 1);
            setMentionQuery(query);
            setShowMentions(true);
            mentionStartPosition.current = lastAt;
        } else {
            setShowMentions(false);
        }
        setNewMessage(text);
    };

    const handleMentionSelect = (name: string) => {
        if (mentionStartPosition.current === null) return;
        
        const prefix = newMessage.substring(0, mentionStartPosition.current);
        const suffix = newMessage.substring(mentionStartPosition.current + 1 + mentionQuery.length);
        
        const newText = `${prefix}@${name} ${suffix.trimStart()}`;
        setNewMessage(newText);
        
        const newCursorPosition = prefix.length + 1 + name.length + 1;
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
        
        setShowMentions(false);
    };

    const mentionSuggestions = useMemo(() => {
        if (!showMentions) return [];
        return members.filter(member =>
            member.name.toLowerCase().includes(mentionQuery.toLowerCase()) &&
            member.id !== user?.id
        ).slice(0, 5);
    }, [showMentions, mentionQuery, members, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showMentions &&
                mentionRef.current &&
                !mentionRef.current.contains(event.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(event.target as Node)
            ) {
                setShowMentions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMentions]);
    
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageToSend({ file, preview: URL.createObjectURL(file) });
        }
    };

    const activeChannelInfo = channels.find(c => c.id === activeChannelId);
    const canWrite = user && (!activeChannelInfo?.admin_only_write || isAdmin);

    const closeSidebars = () => {
        setIsChannelsOpen(false);
        setIsMembersOpen(false);
    };

    return (
        <div className="flex w-full" style={{ height: 'calc(100dvh - 80px)', marginTop: '80px' }}>
            <div className="discord-theme flex flex-1 overflow-hidden">
                <CreateChannelModal isOpen={isCreateChannelModalOpen} onClose={() => setIsCreateChannelModalOpen(false)} onCreate={handleCreateChannel} />
                {/* Overlay for mobile */}
                <div className={`fixed inset-0 bg-black/50 z-30 lg:hidden ${isChannelsOpen || isMembersOpen ? 'block' : 'hidden'}`} onClick={closeSidebars}></div>

                {/* Channels Sidebar */}
                <aside className={`fixed inset-y-0 left-0 top-20 z-40 w-60 bg-[color:var(--bg-secondary)] flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:relative lg:top-0 lg:translate-x-0 ${isChannelsOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <header className="p-4 h-12 flex items-center justify-between shadow-md lg:shadow-none">
                        <h1 className="font-bold text-white text-lg">Canales</h1>
                        {isAdmin && <button onClick={() => setIsCreateChannelModalOpen(true)} title="Crear canal" className="w-6 h-6 flex items-center justify-center text-xl text-text-muted hover:text-text-main">+</button>}
                    </header>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                        {channels.map(channel => (
                            <div key={channel.id} className="group relative">
                                <a href="#" onClick={(e) => { e.preventDefault(); setActiveChannelId(channel.id); closeSidebars(); }} className={`flex items-center space-x-2 w-full text-left px-2 py-1.5 rounded transition-colors channel-link text-[color:var(--text-muted)] ${activeChannelId === channel.id ? 'active' : ''}`}>
                                    <span className="text-xl">#</span>
                                    <span className="flex-1 truncate">{channel.name}</span>
                                    {channel.unreadCount && channel.unreadCount > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{channel.unreadCount}</span>
                                    )}
                                </a>
                                {isAdmin && channel.id !== 1 && (
                                    <button onClick={() => handleDeleteChannel(channel.id)} title="Eliminar canal" className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 hidden group-hover:flex items-center justify-center text-text-muted hover:text-red-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </nav>
                </aside>

                <div className="flex-1 flex flex-col min-w-0 bg-[color:var(--bg-primary)]">
                    <header className="flex items-center justify-between p-2 h-12 border-b border-black/20 shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <button className="p-2 lg:hidden text-[color:var(--header-secondary)]" onClick={() => setIsChannelsOpen(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div className="flex items-baseline gap-2">
                                <h1 className="text-lg font-bold flex items-center space-x-2 text-[color:var(--header-primary)]"><span className="text-xl text-[color:var(--channel-icon)]">#</span><span>{activeChannelInfo?.name}</span></h1>
                                <p className="text-sm text-text-muted truncate hidden sm:block">{activeChannelInfo?.description}</p>
                            </div>
                        </div>
                        <button className="p-2 lg:hidden text-[color:var(--header-secondary)]" onClick={() => setIsMembersOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2" /></svg>
                        </button>
                    </header>
                    <div className="flex-1 flex min-h-0">
                        <main className="flex-1 flex flex-col min-h-0">
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto discord-chat-messages px-4">
                                {isLoading ? <div className="flex justify-center items-center h-full text-text-muted">Cargando mensajes...</div> :
                                    <>
                                        <div className="h-4" />
                                        {renderableChatItems.map((item, index) => {
                                            switch (item.type) {
                                                case 'date_divider':
                                                    return <DateDivider key={`divider-${index}`} date={item.date} />;
                                                case 'message_group':
                                                    const group = item.group;
                                                    return (
                                                        <div key={group[0].id} id={`message-group-${group[0].id}`} className="discord-message-group">
                                                            {group.map((message, msgIndex) => {
                                                                if (editingMessage?.id === message.id) {
                                                                    return (
                                                                        <div key={message.id} className="px-16 py-2">
                                                                            <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="discord-chat-textarea w-full bg-[color:var(--input-bg)] rounded-md p-2" rows={3}/>
                                                                            <div className="text-xs mt-1">presiona <strong className="text-primary">Enter</strong> para guardar, <strong className="text-primary">Esc</strong> para cancelar</div>
                                                                            <button onClick={handleEditMessage} className="text-xs px-2 py-1 bg-primary rounded mt-1">Guardar</button>
                                                                            <button onClick={() => setEditingMessage(null)} className="text-xs px-2 py-1 ml-2">Cancelar</button>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (<MessageItem key={message.id} message={message} isGroupStart={msgIndex === 0} user={user} isAdmin={isAdmin} setReplyingTo={setReplyingTo} setEditingMessage={setEditingMessage} onDelete={handleDeleteMessage} onToggleReaction={handleToggleReaction} onViewProfile={onViewProfile} />);
                                                            })}
                                                        </div>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })}
                                        <div className="h-4" />
                                    </>
                                }
                            </div>
                            <footer className="relative px-4 pb-4 pt-2 flex-shrink-0">
                                 {showMentions && mentionSuggestions.length > 0 && (
                                    <div ref={mentionRef} className="absolute bottom-full left-0 right-0 mb-1 px-4 z-10">
                                        <div className="bg-[color:var(--bg-secondary)] border border-black/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            <div className="p-2 font-bold text-xs text-text-muted">Mencionar a:</div>
                                            <ul>
                                                {mentionSuggestions.map(member => (
                                                    <li key={member.id} onClick={() => handleMentionSelect(member.name)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[color:var(--bg-hover)] cursor-pointer">
                                                        {member.profile_picture_url ? <img src={member.profile_picture_url} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                                                        : <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${getConsistentColor(member.name)}`}>{getUserInitials(member.name)}</div>}
                                                        <span className="text-sm text-text-normal">{member.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                                {canWrite ? (
                                    <div className="discord-chat-input-wrapper">
                                        {replyingTo && (
                                            <div className="reply-bar">
                                                <span>Respondiendo a <strong>{replyingTo.user}</strong></span>
                                                <button onClick={() => setReplyingTo(null)} className="text-xl">&times;</button>
                                            </div>
                                        )}
                                        {imageToSend && (
                                            <div className="p-2 relative w-24 h-24">
                                                <img src={imageToSend.preview} alt="Previsualización" className="w-full h-full object-cover rounded-md" />
                                                <button onClick={() => setImageToSend(null)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">&times;</button>
                                            </div>
                                        )}
                                        <div className="flex items-start pt-2">
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-muted hover:text-text-main">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                                            <textarea ref={textareaRef} placeholder={`Enviar mensaje a #${activeChannelInfo?.name}`} className="discord-chat-textarea"
                                                value={newMessage} onChange={handleTextAreaChange}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} rows={1}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-sm text-[color:var(--text-muted)] bg-[color:var(--input-bg)] p-3 rounded-lg">{user ? 'Solo los administradores pueden enviar mensajes.' : 'Debes iniciar sesión para enviar mensajes.'}</div>
                                )}
                            </footer>
                        </main>

                        {/* Members Sidebar */}
                        <aside className={`fixed inset-y-0 right-0 top-20 z-40 w-60 discord-sidebar-members flex-shrink-0 p-2 flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:top-0 lg:flex lg:translate-x-0 ${isMembersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                            <h2 className="p-2 text-[color:var(--header-secondary)] text-xs font-bold uppercase flex-shrink-0">Miembros — {members.length}</h2>
                            <div className="flex-1 overflow-y-auto pr-1">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center p-2 rounded-md hover:bg-[color:var(--bg-hover)] cursor-pointer" onClick={() => {onViewProfile(member.id); closeSidebars();}}>
                                        <div className="relative mr-3">
                                            {member.profile_picture_url ? (
                                                <img src={member.profile_picture_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getConsistentColor(member.name)}`}>
                                                    {getUserInitials(member.name)}
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[color:var(--bg-secondary)] ${member.is_online ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                                        </div>
                                        <div className="flex-1 truncate">
                                            <span className="text-sm font-semibold text-[color:var(--text-normal)]">{member.name}</span>
                                            {member.is_admin && <span className="ml-2 discord-admin-tag">ADMIN</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComunidadPage;