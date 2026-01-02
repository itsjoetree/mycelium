import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useTradeById, useAcceptTrade, useRejectTrade, useCancelTrade } from '../hooks/useTrades';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TradeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    tradeId: number | null;
    currentUserId: number;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
    isOpen, onClose, tradeId, currentUserId
}) => {
    const { data: trade, isLoading } = useTradeById(tradeId);
    const acceptTrade = useAcceptTrade();
    const rejectTrade = useRejectTrade();
    const cancelTrade = useCancelTrade();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    if (!isOpen || !tradeId) return null;

    const handleAction = async (action: 'accept' | 'reject' | 'cancel') => {
        try {
            if (action === 'accept') {
                await acceptTrade.mutateAsync(tradeId);
                toast.success('Barter protocol finalized');
            } else if (action === 'reject') {
                await rejectTrade.mutateAsync(tradeId);
                toast.success('Proposal declined');
            } else if (action === 'cancel') {
                await cancelTrade.mutateAsync(tradeId);
                toast.success('Signal aborted');
            }
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['interactions'] }),
                queryClient.invalidateQueries({ queryKey: ['trades'] }),
                queryClient.invalidateQueries({ queryKey: ['resources'] })
            ]);
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Action failed');
        }
    };

    const isInitiator = trade?.initiatorId === currentUserId;
    const isPending = trade?.status === 'PENDING';

    const offeredItems = trade?.resources.filter(r => r.ownerId === trade.initiatorId) || [];
    const requestedItems = trade?.resources.filter(r => r.ownerId === trade.receiverId) || [];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
            <Card className="w-full max-w-2xl border-primary/30 shadow-[0_0_100px_var(--accent-glow)] overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-glass-surface flex justify-between items-center bg-black/20">
                    <div>
                        <h3 className="text-xl font-bold text-glow-primary">{t('trade.detail.title')}</h3>
                        <p className="text-text-muted font-mono text-[0.6rem] uppercase mt-1 tracking-widest">{t('trade.detail.status_prefix', { id: tradeId, status: trade?.status })}</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-[0.6rem] font-mono text-primary animate-pulse uppercase tracking-widest">{t('trade.detail.fetching')}</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <div className="flex flex-col gap-1">
                                    <span className="text-text-muted uppercase text-[0.5rem]">{t('trade.detail.initiator')}</span>
                                    <span className="font-bold">@{trade?.initiatorUsername}</span>
                                </div>
                                <div className="h-px flex-1 mx-4 bg-gradient-to-r from-transparent via-white/10 to-transparent self-end mb-1" />
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-text-muted uppercase text-[0.5rem]">{t('trade.detail.target')}</span>
                                    <span className="font-bold">@{trade?.receiverUsername}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Offered */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_5px_#00b7ff]" />
                                        <h4 className="text-[0.6rem] uppercase font-bold tracking-widest text-secondary">{t('trade.detail.offered_assets')}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {offeredItems.map((res: any, i: number) => (
                                            <div key={i} className="p-3 bg-secondary/5 border border-secondary/20 rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold truncate">{res.title}</span>
                                                    <span className="text-[0.6rem] font-mono text-secondary ml-2 whitespace-nowrap">{res.quantity} {res.unit}</span>
                                                </div>
                                                <div className="text-[0.5rem] uppercase text-text-muted mt-1">{res.type}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Requested */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_var(--accent)]" />
                                        <h4 className="text-[0.6rem] uppercase font-bold tracking-widest text-primary">{t('trade.detail.requested_assets')}</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {requestedItems.map((res: any, i: number) => (
                                            <div key={i} className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold truncate">{res.title}</span>
                                                    <span className="text-[0.6rem] font-mono text-primary ml-2 whitespace-nowrap">{res.quantity} {res.unit}</span>
                                                </div>
                                                <div className="text-[0.5rem] uppercase text-text-muted mt-1">{res.type}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-glass-surface bg-black/40 flex justify-end gap-4">
                    <Button variant="ghost" onClick={onClose} className="uppercase tracking-widest text-[0.7rem] px-6">{t('trade.detail.close')}</Button>
                    {isPending && (
                        <>
                            {isInitiator ? (
                                <Button
                                    onClick={() => handleAction('cancel')}
                                    variant="ghost"
                                    className="border border-red-500/30 text-red-500 hover:bg-red-500/10 uppercase tracking-widest text-[0.7rem] px-6"
                                    isLoading={cancelTrade.isPending}
                                >
                                    {t('trade.detail.abort')}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => handleAction('reject')}
                                        variant="ghost"
                                        className="border border-red-500/30 text-red-500 hover:bg-red-500/10 uppercase tracking-widest text-[0.7rem] px-6"
                                        isLoading={rejectTrade.isPending}
                                    >
                                        {t('trade.detail.decline')}
                                    </Button>
                                    <Button
                                        onClick={() => handleAction('accept')}
                                        className="shadow-[0_0_20px_var(--accent-glow)] uppercase tracking-widest text-[0.7rem] px-8"
                                        isLoading={acceptTrade.isPending}
                                    >
                                        {t('trade.detail.finalize')}
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </Card>

            <style>{`
                .text-glow-primary {
                    text-shadow: 0 0 10px var(--accent-glow);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--accent-glow);
                }
            `}</style>
        </div>
    );
};
