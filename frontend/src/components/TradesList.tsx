import React from 'react';
import { useTradesList, useAcceptTrade, useCancelTrade, useRejectTrade } from '../hooks/useTrades';
import { useQueryClient } from '@tanstack/react-query';
import { useUserSession } from '../hooks/useAuth';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { toast } from 'sonner';

export const TradesList: React.FC = () => {
    const { data: session } = useUserSession();
    const { data: trades, isLoading } = useTradesList();
    const acceptTrade = useAcceptTrade();
    const cancelTrade = useCancelTrade();
    const rejectTrade = useRejectTrade();
    const [view, setView] = React.useState<'active' | 'log'>('active');

    const queryClient = useQueryClient();

    const handleAccept = async (id: number) => {
        try {
            await acceptTrade.mutateAsync(id);
            toast.success('Trade accepted');
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        } catch (err: any) {
            toast.error(err?.message || 'Failed to accept trade');
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await cancelTrade.mutateAsync(id);
            toast.info('Trade proposal cancelled');
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        } catch (err: any) {
            toast.error(err?.message || 'Failed to cancel trade');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await rejectTrade.mutateAsync(id);
            toast.info('Trade proposal declined');
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        } catch (err: any) {
            toast.error(err?.message || 'Failed to reject trade');
        }
    };

    if (isLoading) return <div className="text-text-muted font-mono text-xs p-4 text-center">Loading activity...</div>;

    const activeTrades = trades?.filter((t: any) => t.status === 'PENDING') || [];
    const historicalTrades = trades?.filter((t: any) => t.status !== 'PENDING') || [];
    const displayTrades = view === 'active' ? activeTrades : historicalTrades;

    return (
        <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-black/40 border border-glass-surface rounded-md mb-2">
                <button
                    onClick={() => setView('active')}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded border transition-all duration-200
                        ${view === 'active'
                            ? 'bg-secondary/20 text-secondary border-secondary/30 shadow-[0_0_10px_rgba(0,183,255,0.1)]'
                            : 'border-transparent text-text-muted hover:text-text hover:bg-white/5'}`}
                >
                    Proposals ({activeTrades.length})
                </button>
                <button
                    onClick={() => setView('log')}
                    className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded border transition-all duration-200
                        ${view === 'log'
                            ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgb(var(--accent-rgb)/0.1)]'
                            : 'border-transparent text-text-muted hover:text-text hover:bg-white/5'}`}
                >
                    Log ({historicalTrades.length})
                </button>
            </div>

            {displayTrades.length === 0 ? (
                <div className="text-text-muted font-mono text-[10px] p-8 text-center border border-dashed border-glass-surface rounded-sm">
                    No {view} records found
                </div>
            ) : (
                <div className="space-y-3">
                    {displayTrades.map((trade: any) => {
                        const isInitiator = trade.initiatorId === session?.id;
                        const otherParty = isInitiator ? trade.receiverUsername || `Node #${trade.receiverId}` : trade.initiatorUsername || `Node #${trade.initiatorId}`;

                        return (
                            <Card key={trade.id} className={`p-3 border-glass-surface transition-colors
                                ${view === 'log' ? 'bg-[rgba(10,10,10,0.4)] opacity-80' : 'bg-[rgba(5,20,18,0.4)]'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-[0.6rem] uppercase tracking-tighter text-text-muted mb-1">
                                            {isInitiator ? 'Outgoing' : 'Incoming'}
                                            {view === 'log' && ` • ${trade.status}`}
                                        </div>
                                        <div className="font-mono text-xs font-bold text-primary">@{otherParty}</div>
                                    </div>
                                    {view === 'active' && (
                                        <span className="text-[0.6rem] px-1.5 py-0.5 rounded border border-secondary/30 text-secondary font-bold">
                                            {trade.status}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-3 py-1.5 px-2 bg-black/20 rounded border border-glass-surface/10">
                                    <div className="space-y-3">
                                        {/* Items coming TO the current user (once accepted/completed) */}
                                        <div>
                                            <div className="text-[0.5rem] text-primary uppercase font-bold mb-1 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-primary" />
                                                Receiving
                                            </div>
                                            <div className="space-y-1 pl-2">
                                                {(() => {
                                                    // Logic: If Pending, items NOT owned by me are receiving.
                                                    // If Accepted, items NOW owned by me were the ones received.
                                                    const items = trade.resources?.filter((r: any) => {
                                                        if (trade.status === 'PENDING') return r.ownerId !== session?.id;
                                                        return r.ownerId === session?.id;
                                                    });

                                                    if (!items || items.length === 0) {
                                                        return <div className="text-[0.6rem] text-text-muted italic py-1 border border-dashed border-white/5 rounded-sm px-2">No items requested</div>;
                                                    }

                                                    return items.map((r: any, idx: number) => (
                                                        <div key={idx} className="text-[0.7rem] text-text font-medium flex justify-between">
                                                            <span className="truncate">{r.title}</span>
                                                            <span className="text-primary ml-2 flex-shrink-0">{r.quantity} {r.unit}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>

                                        {/* Items going FROM the current user */}
                                        <div>
                                            <div className="text-[0.5rem] text-secondary uppercase font-bold mb-1 flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-secondary" />
                                                Offering
                                            </div>
                                            <div className="space-y-1 pl-2">
                                                {(() => {
                                                    // Logic: If Pending, items owned by me are offering.
                                                    // If Accepted, items NO LONGER owned by me were the ones offered.
                                                    const items = trade.resources?.filter((r: any) => {
                                                        if (trade.status === 'PENDING') return r.ownerId === session?.id;
                                                        return r.ownerId !== session?.id;
                                                    });

                                                    if (!items || items.length === 0) {
                                                        return <div className="text-[0.6rem] text-text-muted italic py-1 border border-dashed border-white/5 rounded-sm px-2">No items offered in exchange</div>;
                                                    }

                                                    return items.map((r: any, idx: number) => (
                                                        <div key={idx} className="text-[0.7rem] text-text font-medium flex justify-between">
                                                            <span className="truncate">{r.title}</span>
                                                            <span className="text-secondary ml-2 flex-shrink-0">{r.quantity} {r.unit}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {trade.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                        {isInitiator ? (
                                            <Button
                                                variant="outline"
                                                className="flex-1 py-1.5 text-[0.6rem] border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                                onClick={() => handleCancel(trade.id)}
                                                isLoading={cancelTrade.isPending}
                                            >
                                                Cancel
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 py-1.5 text-[0.6rem] border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                                    onClick={() => handleReject(trade.id)}
                                                    isLoading={rejectTrade.isPending}
                                                >
                                                    Decline
                                                </Button>
                                                <Button
                                                    className="flex-1 py-1.5 text-[0.6rem]"
                                                    onClick={() => handleAccept(trade.id)}
                                                    isLoading={acceptTrade.isPending}
                                                >
                                                    Accept
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="text-[0.55rem] text-text-muted/60 mt-1 font-mono flex justify-between">
                                    <span>#{trade.id.toString().padStart(4, '0')}</span>
                                    <span>{new Date(trade.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
