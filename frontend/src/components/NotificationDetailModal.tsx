import React from 'react';
import { useTradeById } from '../hooks/useTrades';
import { Button } from './ui/Button';

interface NotificationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    tradeId: number;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({ isOpen, onClose, tradeId }) => {
    const { data: trade, isLoading } = useTradeById(tradeId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-black border border-glass-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-glass-surface flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Trade Details</h2>
                        <p className="text-[0.6rem] text-text-muted uppercase tracking-widest font-mono">ID: {tradeId}</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {isLoading ? (
                        <div className="py-12 text-center animate-pulse text-primary font-mono text-sm">
                            Synchronizing trade data...
                        </div>
                    ) : trade ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-[0.6rem] text-text-muted uppercase block mb-1">Initiator</span>
                                    <span className="text-sm font-bold">@{trade.initiatorUsername ?? 'unknown'}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-[0.6rem] text-text-muted uppercase block mb-1">Receiver</span>
                                    <span className="text-sm font-bold">@{trade.receiverUsername ?? 'unknown'}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[0.6rem] text-text-muted uppercase tracking-widest font-mono mb-3 border-b border-white/5 pb-1">Items in Trade</h3>
                                <div className="space-y-2">
                                    {trade.resources?.map((res: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-black/40 border border-glass-surface rounded-lg">
                                            <div>
                                                <span className="text-sm font-bold block">{res.title}</span>
                                                <span className="text-[0.6rem] text-text-muted uppercase">{res.type}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-primary">{res.quantity} {res.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-glass-surface mt-6">
                                <div>
                                    <span className="text-[0.6rem] text-text-muted uppercase block mb-1">Status</span>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border inline-block
                                        ${trade.status === 'PENDING' ? 'border-primary text-primary bg-primary/10' :
                                            trade.status === 'ACCEPTED' ? 'border-secondary text-secondary bg-secondary/10' :
                                                trade.status === 'REJECTED' ? 'border-red-500/50 text-red-400 bg-red-400/5' :
                                                    'border-text-muted text-text-muted bg-white/5'}`}>
                                        {trade.status}
                                    </span>
                                </div>
                                <Button onClick={onClose} className="px-8">Close</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-red-400">
                            Failed to load trade data. It may have been a hallucination in the network.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
