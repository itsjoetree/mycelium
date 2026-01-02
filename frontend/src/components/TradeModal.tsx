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
    resources: any[]; // Friend's resources
    myResources: any[]; // Own resources
    defaultAll?: boolean;
    onSuccess?: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
    isOpen, onClose, receiverId, receiverUsername, resources, myResources, defaultAll = true, onSuccess
}) => {
    const queryClient = useQueryClient();
    const createTrade = useCreateTrade();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedFriendResourceIds, setSelectedFriendResourceIds] = useState<number[]>(
        defaultAll ? resources.map(r => r.id) : []
    );
    const [offeredIds, setOfferedIds] = useState<number[]>(
        defaultAll ? myResources.map(r => r.id) : []
    );

    const [friendSearch, setFriendSearch] = useState('');
    const [mySearch, setMySearch] = useState('');

    const toggleFriendResource = (id: number) => {
        setSelectedFriendResourceIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleOffered = (id: number) => {
        setOfferedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleTrade = async () => {
        if (selectedFriendResourceIds.length === 0) {
            toast.error('Select at least one resource to request');
            return;
        }

        setIsSubmitting(true);
        try {
            await createTrade.mutateAsync({
                receiverId,
                resourceIds: [...selectedFriendResourceIds, ...offeredIds]
            });
            toast.success('Trade proposal broadcasted across the network');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['trades'] }),
                queryClient.invalidateQueries({ queryKey: ['resources'] })
            ]);
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Transmission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFriendResources = resources.filter(r =>
        r.title.toLowerCase().includes(friendSearch.toLowerCase()) ||
        r.type.toLowerCase().includes(friendSearch.toLowerCase())
    );

    const filteredMyResources = myResources.filter(r =>
        r.title.toLowerCase().includes(mySearch.toLowerCase()) ||
        r.type.toLowerCase().includes(mySearch.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] p-4">
            <Card className="w-full max-w-5xl border-primary/30 shadow-[0_0_100px_var(--accent-glow)] max-h-[90vh] flex flex-col overflow-hidden bg-background">
                <div className="p-6 border-b border-glass-surface flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-glow-primary">Initiate Barter Protocol</h3>
                        <p className="text-text-muted font-mono text-[0.6rem] uppercase mt-1 tracking-widest text-primary/80">Synchronizing with Node @{receiverUsername}</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Side: Friend's Inventory */}
                    <div className="flex-1 border-r border-glass-surface flex flex-col p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_var(--accent)]" />
                                <h4 className="text-xs uppercase font-bold tracking-widest">Target Inventory</h4>
                            </div>
                            <span className="text-[0.6rem] font-mono text-primary/60">{selectedFriendResourceIds.length} SELECTED</span>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={friendSearch}
                                onChange={(e) => setFriendSearch(e.target.value)}
                                placeholder="Filter target assets..."
                                className="w-full h-9 bg-black/40 border border-white/5 rounded px-3 text-xs font-mono outline-none focus:border-primary/40 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {filteredFriendResources.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-30 italic text-xs">No assets found</div>
                            ) : (
                                filteredFriendResources.map(res => (
                                    <button
                                        key={res.id}
                                        onClick={() => toggleFriendResource(res.id)}
                                        className={`w-full flex justify-between items-center p-3 rounded-lg border transition-all text-left group
                                            ${selectedFriendResourceIds.includes(res.id)
                                                ? 'bg-primary/20 border-primary shadow-[0_0_15px_var(--accent-glow)]'
                                                : 'bg-black/20 border-white/5 hover:border-primary/40 hover:bg-white/5'}`}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">{res.title}</span>
                                            <span className="text-[0.6rem] text-text-muted uppercase tracking-tighter">{res.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`text-xs font-mono font-bold ${selectedFriendResourceIds.includes(res.id) ? 'text-primary' : 'text-text-muted'}`}>
                                                {res.quantity} {res.unit}
                                            </span>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                                                ${selectedFriendResourceIds.includes(res.id) ? 'border-primary bg-primary text-black' : 'border-white/10'}`}>
                                                {selectedFriendResourceIds.includes(res.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Side: Your Inventory */}
                    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-white/([0.02])">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#00b7ff]" />
                                <h4 className="text-xs uppercase font-bold tracking-widest text-secondary">Your Offerings</h4>
                            </div>
                            <span className="text-[0.6rem] font-mono text-secondary/60">{offeredIds.length} SELECTED</span>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                value={mySearch}
                                onChange={(e) => setMySearch(e.target.value)}
                                placeholder="Filter your assets..."
                                className="w-full h-9 bg-black/40 border border-white/5 rounded px-3 text-xs font-mono outline-none focus:border-secondary/40 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {filteredMyResources.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-30 italic text-xs">No assets available</div>
                            ) : (
                                filteredMyResources.map(res => (
                                    <button
                                        key={res.id}
                                        onClick={() => toggleOffered(res.id)}
                                        className={`w-full flex justify-between items-center p-3 rounded-lg border transition-all text-left group
                                            ${offeredIds.includes(res.id)
                                                ? 'bg-secondary/20 border-secondary shadow-[0_0_15px_rgba(0,183,255,0.1)]'
                                                : 'bg-black/20 border-white/5 hover:border-secondary/40 hover:bg-white/5'}`}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold truncate group-hover:text-secondary transition-colors">{res.title}</span>
                                            <span className="text-[0.6rem] text-text-muted uppercase tracking-tighter">{res.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className={`text-xs font-mono font-bold ${offeredIds.includes(res.id) ? 'text-secondary' : 'text-text-muted'}`}>
                                                {res.quantity} {res.unit}
                                            </span>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all
                                                ${offeredIds.includes(res.id) ? 'border-secondary bg-secondary text-black' : 'border-white/10'}`}>
                                                {offeredIds.includes(res.id) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-glass-surface flex justify-between items-center bg-black/40">
                    <div className="space-y-1">
                        <p className="text-[0.6rem] text-text-muted uppercase font-mono tracking-widest">Protocol Summary</p>
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="text-primary">{selectedFriendResourceIds.length} Assets Requested</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-secondary">{offeredIds.length} Assets Offered</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="uppercase tracking-widest text-[0.7rem] px-6">Abort</Button>
                        <Button
                            onClick={handleTrade}
                            isLoading={isSubmitting}
                            disabled={selectedFriendResourceIds.length === 0}
                            className="uppercase tracking-widest text-[0.7rem] px-8 shadow-[0_0_20px_var(--accent-glow)]"
                        >
                            Commit Proposal
                        </Button>
                    </div>
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
