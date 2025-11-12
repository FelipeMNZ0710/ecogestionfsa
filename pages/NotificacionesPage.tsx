import React, { useState, useMemo, useEffect } from 'react';
import type { User, Page, Achievement } from '../types';

interface NotificacionesPageProps {
    user: User | null;
    setCurrentPage: (page: Page, params?: { userId?: string }) => void;
    onNotificationsViewed: () => void;
}

type ProfileNotification = { type: 'achievement', id: number, icon: string, title: string, message: string, time: string };
type CommunityNotification = { type: 'mention' | 'reply', id: number, icon: string, fromUser: string, channel: string, channelId: number, messageId: number, messageSnippet: string, repliedTo?: string, time: string, is_read: boolean };

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `hace ${Math.floor(interval)} año${Math.floor(interval) > 1 ? 's' : ''}`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `hace ${Math.floor(interval)} mes${Math.floor(interval) > 1 ? 'es' : ''}`;

    interval = seconds / 86400;
    if (interval > 1) return `hace ${Math.floor(interval)} día${Math.floor(interval) > 1 ? 's' : ''}`;
    
    interval = seconds / 3600;
    if (interval > 1) return `hace ${Math.floor(interval)} hora${Math.floor(interval) > 1 ? 's' : ''}`;
    
    interval = seconds / 60;
    if (interval > 1) return `hace ${Math.floor(interval)} minuto${Math.floor(interval) > 1 ? 's' : ''}`;
    
    return 'justo ahora';
}


const ProfileNotificationItem: React.FC<{ notification: ProfileNotification }> = ({ notification }) => (
    <div className="modern-card p-4 flex items-start gap-4">
        <div className="text-3xl mt-1">{notification.icon}</div>
        <div className="flex-grow">
            <h3 className="font-bold text-text-main">{notification.title}</h3>
            <p className="text-sm text-text-secondary">{notification.message}</p>
        </div>
        <div className="text-xs text-text-secondary flex-shrink-0">{notification.time}</div>
    </div>
);

const CommunityNotificationItem: React.FC<{ notification: CommunityNotification, setCurrentPage: (page: Page, params?: { userId?: string }) => void }> = ({ notification, setCurrentPage }) => {
    const handleGoToMessage = () => {
        sessionStorage.setItem('navigateToCommunity', JSON.stringify({
            channelId: notification.channelId,
            messageId: notification.messageId,
        }));
        setCurrentPage('comunidad');
    };

    const isReply = notification.type === 'reply';

    return (
        <div className="modern-card p-4 flex items-start gap-4 cursor-pointer" onClick={handleGoToMessage}>
            <div className={`text-2xl mt-1 font-bold ${notification.type === 'mention' ? 'text-primary' : 'text-blue-400'}`}>
                {notification.icon}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <p className="text-text-main text-sm mb-2 pr-4">
                        <span className="font-bold">{notification.fromUser}</span>
                        {isReply ? ' respondió a tu mensaje en ' : ' te mencionó en '}
                        <span className="font-bold text-primary">#{notification.channel}</span>
                    </p>
                    <div className="text-xs text-text-secondary flex-shrink-0">{notification.time}</div>
                </div>

                <div className="space-y-2">
                    {isReply && notification.repliedTo && (
                        <div className="relative pl-3 text-sm text-text-secondary before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-slate-600 before:rounded-full">
                            <p className="italic truncate">"{notification.repliedTo}"</p>
                        </div>
                    )}
                    <p className="text-text-main font-semibold">{notification.messageSnippet}</p>
                </div>
            </div>
        </div>
    );
};


const NotificacionesPage: React.FC<NotificacionesPageProps> = ({ user, setCurrentPage, onNotificationsViewed }) => {
    const [activeTab, setActiveTab] = useState<'perfil' | 'comunidad'>('comunidad');
    const [communityNotifications, setCommunityNotifications] = useState<CommunityNotification[]>([]);
    const [profileNotifications, setProfileNotifications] = useState<ProfileNotification[]>([]);
    const [isCommunityLoading, setIsCommunityLoading] = useState(true);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
    
        // This function will be called AFTER we display the unread notifications
        const markCommunityNotificationsAsRead = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/notifications/mark-all-read/${user.id}`, { method: 'PUT' });
                if (response.ok) {
                    onNotificationsViewed(); // This updates the header count
                }
            } catch (error) {
                console.error("Failed to mark notifications as read:", error);
            }
        };
    
        const fetchProfileNotifications = async () => {
            setIsProfileLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/api/notifications/profile/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    const formattedData = data.map((n: any) => ({ ...n, time: formatTimeAgo(n.time) }));
                    setProfileNotifications(formattedData);
                }
            } catch (error) {
                console.error("Failed to fetch profile notifications:", error);
            } finally {
                setIsProfileLoading(false);
            }
        };
    
        const fetchCommunityNotifications = async () => {
            setIsCommunityLoading(true);
            try {
                const response = await fetch(`http://localhost:3001/api/notifications/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Filter to get only notifications that are currently unread
                    const unreadNotifications = data.filter((n: any) => !n.is_read);
    
                    const formattedData = unreadNotifications.map((n: any) => ({ ...n, time: formatTimeAgo(n.time) }));
                    setCommunityNotifications(formattedData);
                    
                    // After we have the list to display, we can mark them as read in the DB
                    if (unreadNotifications.length > 0) {
                        markCommunityNotificationsAsRead();
                    } else {
                        // If there are no unread notifications, ensure the header count is also zero.
                        onNotificationsViewed();
                    }
                }
            } catch (error) {
                console.error("Failed to fetch community notifications:", error);
            } finally {
                setIsCommunityLoading(false);
            }
        };
        
        fetchProfileNotifications();
        fetchCommunityNotifications();
    }, [user, onNotificationsViewed]);


    if (!user) {
        return (
            <div className="flex items-center justify-center pt-20 h-screen text-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Inicia sesión para ver tus notificaciones</h1>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (activeTab === 'perfil') {
             if (isProfileLoading) {
                 return <div className="text-center py-16 text-text-secondary">Cargando notificaciones...</div>;
             }
            return profileNotifications.length > 0 ? (
                profileNotifications.map((notif, index) => (
                    <div key={notif.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <ProfileNotificationItem notification={notif} />
                    </div>
                ))
            ) : (
                <div className="text-center py-16 modern-card animate-fade-in-up">
                    <div className="text-6xl mb-4">📭</div>
                    <h2 className="text-xl font-bold text-text-main">No tienes notificaciones en esta sección</h2>
                    <p className="text-text-secondary mt-2">¡Completa juegos, haz check-in y participa para verlas aquí!</p>
                </div>
            );
        } else {
             if (isCommunityLoading) {
                 return <div className="text-center py-16 text-text-secondary">Cargando notificaciones...</div>;
             }
             return communityNotifications.length > 0 ? (
                communityNotifications.map((notif, index) => (
                    <div key={notif.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <CommunityNotificationItem notification={notif} setCurrentPage={setCurrentPage} />
                    </div>
                ))
            ) : (
                <div className="text-center py-16 modern-card animate-fade-in-up">
                    <div className="text-6xl mb-4">📭</div>
                    <h2 className="text-xl font-bold text-text-main">No tienes notificaciones nuevas</h2>
                    <p className="text-text-secondary mt-2">Participa en la comunidad para recibir menciones y respuestas.</p>
                </div>
            );
        }
    };

    return (
        <div className="bg-background pt-20 min-h-screen">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="text-center mb-8 animate-fade-in-up">
                    <h1 className="text-4xl font-extrabold font-display text-text-main sm:text-5xl">Centro de Notificaciones</h1>
                    <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">Un resumen de tu actividad reciente, logros y menciones.</p>
                </header>

                <div className="mb-6 flex justify-center border-b border-white/10">
                    <button 
                        onClick={() => setActiveTab('comunidad')}
                        className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'comunidad' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        Comunidad
                    </button>
                    <button 
                        onClick={() => setActiveTab('perfil')}
                        className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'perfil' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-main'}`}
                    >
                        Perfil
                    </button>
                </div>

                <div className="space-y-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default NotificacionesPage;