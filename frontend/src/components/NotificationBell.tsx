import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications, useReadNotification, useReadAllNotifications } from '../hooks/useNotifications';
import { NotificationDetailModal } from './NotificationDetailModal';
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

export const NotificationBell: React.FC = () => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const navigate = useNavigate();

    const { data: notifications = [] } = useNotifications();
    const readNotification = useReadNotification();
    const readAll = useReadAllNotifications();

    const unreadCount = (notifications as any[]).filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await readNotification.mutateAsync(notification.id);
        }

        if (notification.tradeId) {
            setSelectedTradeId(notification.tradeId);
            setDetailModalOpen(true);
            setIsOpen(false); // Close dropdown
        } else if (notification.type.startsWith('FRIEND_')) {
            navigate('/social');
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-text-muted hover:text-primary transition-colors focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[0.6rem] font-bold text-black items-center justify-center">
                            {unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-black border border-glass-surface rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-glass-surface flex justify-between items-center bg-white/5">
                            <h3 className="text-sm font-bold text-primary">{t('notifications.title')}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => readAll.mutate()}
                                    className="text-[0.6rem] uppercase tracking-wider text-text-muted hover:text-primary transition-colors"
                                >
                                    {t('notifications.mark_all')}
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                            {(notifications as any[]).length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-xs text-text-muted italic">{t('notifications.empty')}</p>
                                </div>
                            ) : (
                                (notifications as any[]).map((n: any) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 border-b border-glass-surface/50 cursor-pointer transition-colors hover:bg-white/5 group
                                            ${!n.isRead ? 'bg-primary/5' : 'opacity-60'}`}
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <span className={`text-[0.6rem] px-1.5 py-0.5 rounded border border-current uppercase font-bold
                                                ${n.type.startsWith('TRADE_PROPOSED') ? 'text-primary' :
                                                    n.type === 'TRADE_ACCEPTED' ? 'text-secondary' :
                                                        n.type.startsWith('FRIEND_') ? 'text-cyan-400' : 'text-text-muted'}`}>
                                                {n.type.replace('TRADE_', '').replace('FRIEND_', 'SOCIAL_')}
                                            </span>
                                            <span className="text-[0.6rem] text-text-muted font-mono">
                                                {formatTimeAgo(n.createdAt, t)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text leading-relaxed">{n.content}</p>
                                        {!n.isRead && (
                                            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgb(var(--accent-rgb)/0.5)]"></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

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
