import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useCreateTrade } from '../hooks/useTrades';
import { toast } from 'sonner';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiverId: number;
    receiverUsername: string;
    resources: any[];
    myResources: any[];
    onSuccess?: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
    isOpen, onClose, receiverId, receiverUsername, resources, myResources, onSuccess
}) => {
    const queryClient = useQueryClient();
    const createTrade = useCreateTrade();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [offeredIds, setOfferedIds] = useState<number[]>([]);

    const toggleOffered = (id: number) => {
        setOfferedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleTrade = async () => {
        setIsSubmitting(true);
        try {
            await createTrade.mutateAsync({
                receiverId,
                resourceIds: [...resources.map(r => r.id), ...offeredIds]
            });
            toast.success(`Barter proposed with ${resources.length} requested / ${offeredIds.length} offered`);
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Trade failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000]">
            <Card className="w-full max-w-lg border-primary shadow-[0_0_50px_rgba(0,255,157,0.2)] max-h-[90vh] flex flex-col">
                <div className="mb-4">
                    <h3 className="mb-1">Propose Barter</h3>
                    <p className="text-text-muted font-mono text-[0.6rem] uppercase">@Node_{receiverUsername || receiverId} Sector</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                    {/* Items to Receive */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <h4 className="text-[0.7rem] uppercase font-bold tracking-widest text-primary">Items you want</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {resources.map(res => (
                                <div key={res.id} className="flex justify-between items-center p-2.5 bg-primary/5 border border-primary/20 rounded-md">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">{res.title}</span>
                                        <span className="text-[0.6rem] text-text-muted">{res.type}</span>
                                    </div>
                                    <span className="text-xs font-mono text-primary">{res.quantity} {res.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Items to Offer */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            <h4 className="text-[0.7rem] uppercase font-bold tracking-widest text-secondary">Your Offer</h4>
                        </div>
                        {myResources.length === 0 ? (
                            <div className="p-4 text-center border border-dashed border-glass-surface rounded text-[0.6rem] text-text-muted font-mono">
                                No available resources in your inventory to offer
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                {myResources.map(res => (
                                    <button
                                        key={res.id}
                                        onClick={() => toggleOffered(res.id)}
                                        className={`flex justify-between items-center p-2.5 rounded-md border transition-all text-left
                                            ${offeredIds.includes(res.id)
                                                ? 'bg-secondary/20 border-secondary shadow-[0_0_10px_rgba(0,183,255,0.1)]'
                                                : 'bg-black/40 border-glass-surface hover:border-text-muted'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">{res.title}</span>
                                            <span className="text-[0.6rem] text-text-muted">{res.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-mono ${offeredIds.includes(res.id) ? 'text-secondary' : 'text-text-muted'}`}>
                                                {res.quantity} {res.unit}
                                            </span>
                                            <div className={`w-3 h-3 rounded-full border flex items-center justify-center
                                                ${offeredIds.includes(res.id) ? 'border-secondary bg-secondary' : 'border-glass-surface'}`}>
                                                {offeredIds.includes(res.id) && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-glass-surface flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[0.5rem] text-text-muted uppercase font-mono">Total Swap</span>
                        <div className="text-xs font-bold">
                            <span className="text-primary">{resources.length} IN</span>
                            <span className="mx-2 text-text-muted">/</span>
                            <span className="text-secondary">{offeredIds.length} OUT</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button onClick={handleTrade} isLoading={isSubmitting} disabled={resources.length === 0}>
                            Send Proposal
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
