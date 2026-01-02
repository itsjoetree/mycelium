import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications, useReadNotification, useReadAllNotifications } from '../hooks/useNotifications';
import { NotificationDetailModal } from '../components/NotificationDetailModal';
import { useNavigate } from 'react-router-dom';

const formatTimeAgo = (dateStr: string, t: any) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('notifications.time.just_now');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('notifications.time.minutes_ago', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notifications.time.hours_ago', { count: hours });
    const days = Math.floor(hours / 24);
    return t('notifications.time.days_ago', { count: days });
};

export const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    const { data: notifications = [], isLoading } = useNotifications();
    const readNotification = useReadNotification();
    const readAll = useReadAllNotifications();

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await readNotification.mutateAsync(notification.id);
        }

        if (notification.tradeId) {
            setSelectedTradeId(notification.tradeId);
            setDetailModalOpen(true);
        } else if (notification.type.startsWith('FRIEND_')) {
            navigate('/social');
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-black p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-wider uppercase mb-1">
                            {t('notifications.title')}
                        </h1>
                        <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
                            System Events & Updates
                        </p>
                    </div>
                    {notifications.length > 0 && notifications.some((n: any) => !n.isRead) && (
                        <button
                            onClick={() => readAll.mutate()}
                            className="text-xs font-bold uppercase tracking-wider text-primary hover:text-white transition-colors border border-primary/30 hover:bg-primary/10 px-4 py-2 rounded-lg"
                        >
                            {t('notifications.mark_all')}
                        </button>
                    )}
                </header>

                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="p-12 border border-glass-surface rounded-xl bg-white/5 text-center">
                            <p className="text-text-muted italic">{t('notifications.empty')}</p>
                        </div>
                    ) : (
                        notifications.map((n: any) => (
                            <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`
                                    relative p-6 border rounded-xl cursor-pointer transition-all duration-300 group
                                    ${n.isRead
                                        ? 'bg-transparent border-glass-surface hover:bg-white/5'
                                        : 'bg-primary/5 border-primary/30 hover:bg-primary/10 shadow-[0_0_15px_-5px_var(--accent)]'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`
                                            text-[0.65rem] px-2 py-0.5 rounded border uppercase font-bold tracking-wider
                                            ${n.type.startsWith('TRADE_PROPOSED') ? 'text-primary border-primary/30 bg-primary/10' :
                                                n.type === 'TRADE_ACCEPTED' ? 'text-secondary border-secondary/30 bg-secondary/10' :
                                                    n.type.startsWith('FRIEND_') ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' :
                                                        'text-text-muted border-white/10 bg-white/5'}
                                        `}>
                                            {n.type.replace('TRADE_', '').replace('FRIEND_', 'SOCIAL_').replace('_', ' ')}
                                        </span>
                                        {!n.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--accent)]" />
                                        )}
                                    </div>
                                    <span className="text-xs text-text-muted font-mono">
                                        {formatTimeAgo(n.createdAt, t)}
                                    </span>
                                </div>
                                <p className="text-sm text-text-main leading-relaxed pl-1">
                                    {n.content}
                                </p>

                                <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedTradeId && (
                <NotificationDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => {
                        setDetailModalOpen(false);
                        setSelectedTradeId(null);
                    }}
                    tradeId={selectedTradeId}
                />
            )}
        </div>
    );
};
