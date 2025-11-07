import React, { useState, useEffect } from 'react';
import type { Notification } from '../types';

interface ToastProps {
    notification: Notification;
}

const Toast: React.FC<ToastProps> = ({ notification }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, 4500); // Start exit animation before it's removed

        return () => clearTimeout(timer);
    }, []);

    const iconBgClass = notification.type === 'achievement' 
        ? 'bg-amber-100 text-amber-600'
        : 'bg-green-100 text-green-600';
    
    return (
        <div className={`toast-notification flex items-start w-full max-w-sm p-4 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 ${isExiting ? 'exiting' : ''}`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${iconBgClass}`}>
                {notification.icon}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
            </div>
        </div>
    );
};

interface NotificationToasterProps {
    notifications: Notification[];
}

const NotificationToaster: React.FC<NotificationToasterProps> = ({ notifications }) => {
    return (
        <div className="toaster-container">
            {notifications.map(notification => (
                <Toast key={notification.id} notification={notification} />
            ))}
        </div>
    );
};

export default NotificationToaster;
