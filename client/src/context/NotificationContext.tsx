import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
    removeNotification: (id: string) => void;
    notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { user, logout } = useAuth();

    const addNotification = (type: NotificationType, message: string, duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, type, message, duration }]);
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    useEffect(() => {
        if (!user) return;

        // Connect to SSE endpoint
        // Connect to SSE endpoint with token
        const token = localStorage.getItem('token');
        const eventSource = new EventSource(`/api/notifications/stream?token=${token}`);

        eventSource.onopen = () => {
            console.log('SSE Connected');
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle different event types
                if (data.type === 'connected') {
                    return;
                }

                if (data.type === 'unread_count') {
                    return;
                }

                // Handle force logout event (when admin changes user roles)
                if (data.type === 'force_logout') {
                    addNotification('warning', data.reason || 'Your session has been terminated. Please log in again.');
                    eventSource.close();
                    setTimeout(() => {
                        logout();
                        window.location.href = '/login';
                    }, 1500);
                    return;
                }

                // For normal notifications
                if (data.message) {
                    addNotification(
                        (data.type === 'error' ? 'error' :
                            data.type === 'warning' ? 'warning' :
                                data.type === 'success' ? 'success' : 'info'),
                        data.message
                    );
                }
            } catch (err) {
                console.error('Error parsing SSE message', err);
            }
        };

        eventSource.onerror = (err) => {
            // console.error('SSE Error', err); // Prevent spamming console
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [user]);

    return (
        <NotificationContext.Provider value={{ addNotification, removeNotification, notifications }}>
            {children}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <NotificationItem key={notification.id} notification={notification} onRemove={removeNotification} />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

const NotificationItem = ({ notification, onRemove }: { notification: Notification; onRemove: (id: string) => void }) => {
    useEffect(() => {
        if (notification.duration) {
            const timer = setTimeout(() => {
                onRemove(notification.id);
            }, notification.duration);
            return () => clearTimeout(timer);
        }
    }, [notification, onRemove]);

    const getIcon = () => {
        switch (notification.type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'error': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (notification.type) {
            case 'success': return 'border-emerald-500/20 bg-emerald-500/10';
            case 'error': return 'border-rose-500/20 bg-rose-500/10';
            case 'warning': return 'border-amber-500/20 bg-amber-500/10';
            default: return 'border-blue-500/20 bg-blue-500/10';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            layout
            className={`pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl border backdrop-blur-md shadow-lg flex items-start gap-3 ${getBgColor()}`}
        >
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-white">{notification.message}</p>
            </div>
            <button onClick={() => onRemove(notification.id)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
