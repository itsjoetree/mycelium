import React, { useState, useRef, useEffect } from 'react';
import { useUserSession } from '../hooks/useAuth';
import { useFriends, usePendingRequests, useOutboundRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useInteractions, useSendMessage, useRemoveFriend } from '../hooks/useSocial';
import { useUserSearch } from '../hooks/useUsers';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { GlobalLoading } from '../components/GlobalLoading';
import { TradeModal } from '../components/TradeModal';
import { TradeDetailModal } from '../components/TradeDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useResources } from '../hooks/useResources';
import { client } from '../lib/api';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export const Social: React.FC = () => {
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const { data: friends } = useFriends();
    const { data: inboundRequests } = usePendingRequests();
    const { data: outboundRequests } = useOutboundRequests();

    const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
    const selectedFriend = friends?.find(f => f.id === selectedFriendId);

    const { data: interactions, isLoading: interactionsLoading } = useInteractions(selectedFriendId);
    const sendMessage = useSendMessage();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: searchResults, isFetching: isSearching } = useUserSearch(debouncedSearch);

    const sendRequest = useSendFriendRequest();
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const removeFriendHook = useRemoveFriend();

    const [msgContent, setMsgContent] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [interactions]);

    // Modal States
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [tradeDetailModalOpen, setTradeDetailModalOpen] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [friendResources, setFriendResources] = useState<any[]>([]);
    const [isFetchingResources, setIsFetchingResources] = useState(false);

    const { data: myResources, refetch: refetchMyResources } = useResources();

    const handleSendRequest = async (userId: number) => {
        try {
            await sendRequest.mutateAsync(userId);
            toast.success('Connection request broadcasted');
        } catch (err: any) {
            toast.error(err?.message || 'Broadcast failed');
        }
    };

    const handleAccept = async (userId: number) => {
        try {
            await acceptRequest.mutateAsync(userId);
            toast.success('Frequency matched. Node synced.');
        } catch (err: any) {
            toast.error('Sync failed');
        }
    };

    const handleReject = async (userId: number) => {
        try {
            await rejectRequest.mutateAsync(userId);
            toast.success('Signal rejected');
        } catch (err: any) {
            toast.error('Rejection failed');
        }
    };

    const handleTradeProposal = async (friend: any) => {
        setIsFetchingResources(true);
        try {
            const [friendRes, _] = await Promise.all([
                client.GET('/resources', { params: { query: { ownerId: friend.id.toString() } } }),
                refetchMyResources()
            ]);

            if (friendRes.data) {
                setFriendResources(friendRes.data as any[]);
                setTradeModalOpen(true);
            }
        } catch (err) {
            toast.error('Failed to intercept node resources');
        } finally {
            setIsFetchingResources(false);
        }
    };

    const handleRemoveConfirm = async () => {
        if (!selectedFriendId) return;
        try {
            await removeFriendHook.mutateAsync(selectedFriendId);
            toast.success('Node disconnected');
            setRemoveModalOpen(false);
            setSelectedFriendId(null);
        } catch (err: any) {
            toast.error('Disconnect protocol failed');
        }
    };

    const handleInspectTrade = (tradeId: number) => {
        setSelectedTradeId(tradeId);
        setTradeDetailModalOpen(true);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFriendId || !msgContent.trim()) return;
        try {
            await sendMessage.mutateAsync({ receiverId: selectedFriendId, content: msgContent });
            setMsgContent('');
        } catch (err: any) {
            toast.error('Failed to transmit message');
        }
    };

    if (sessionLoading) return <GlobalLoading message="INITIALIZING NEURAL LINK..." />;
    if (!session) return null;

    return (
        <div className="flex-1 flex flex-col h-full bg-black overflow-hidden relative">
            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar: Navigation & Discovery */}
                <aside className="w-80 border-r border-white/5 flex flex-col bg-white/[0.01]">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white">Network</h2>
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--accent)]" />
                        </div>

                        {/* Search Field */}
                        <div className="relative group">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Scan Node IDs..."
                                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 pr-10 text-xs font-mono transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isSearching ? (
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                        {/* Search Results */}
                        {debouncedSearch && (
                            <div>
                                <h3 className="text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-3 px-2">Discovery Output</h3>
                                <div className="space-y-1">
                                    {!searchResults || searchResults.length === 0 ? (
                                        <p className="text-[0.6rem] text-text-muted p-4 italic text-center bg-white/[0.02] rounded-xl border border-dashed border-white/5">No compatible nodes detected</p>
                                    ) : (
                                        searchResults.map((user: any) => {
                                            const isFriend = friends?.some(f => f.id === user.id);
                                            const isOutboundPending = outboundRequests?.some(r => r.id === user.id);
                                            return (
                                                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[0.65rem] font-bold text-primary">
                                                            {user.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-white">@{user.username}</p>
                                                            <p className="text-[0.55rem] text-text-muted font-mono">NODE_{user.id.toString().padStart(4, '0')}</p>
                                                        </div>
                                                    </div>
                                                    {!isFriend && user.id !== session.id && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-3 text-[0.6rem] uppercase tracking-widest bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                                                            onClick={() => handleSendRequest(user.id)}
                                                            disabled={isOutboundPending}
                                                        >
                                                            {isOutboundPending ? 'Pulsing...' : 'Link'}
                                                        </Button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Connection Requests */}
                        {inboundRequests && inboundRequests.length > 0 && (
                            <div>
                                <h3 className="text-[0.6rem] font-bold uppercase tracking-widest text-primary mb-3 px-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Incoming Uplinks
                                </h3>
                                <div className="space-y-2">
                                    {inboundRequests.map((req: any) => (
                                        <div key={req.id} className="p-3 rounded-xl bg-primary/[0.03] border border-primary/20 flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs">
                                                    {req.senderUsername[0].toUpperCase()}
                                                </div>
                                                <p className="text-xs font-bold text-white">@{req.senderUsername}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button className="flex-1 h-7 text-[0.6rem] uppercase font-bold" onClick={() => handleAccept(req.senderId)}>Sync</Button>
                                                <Button variant="secondary" className="flex-1 h-7 text-[0.6rem] uppercase font-bold bg-white/5 border-white/10" onClick={() => handleReject(req.senderId)}>Reject</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Friends List */}
                        <div>
                            <h3 className="text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-3 px-2">Synced Nodes</h3>
                            <div className="space-y-1">
                                {friends?.map((friend: any) => (
                                    <button
                                        key={friend.id}
                                        onClick={() => setSelectedFriendId(friend.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border",
                                            selectedFriendId === friend.id
                                                ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_var(--accent-glow)]"
                                                : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg",
                                            selectedFriendId === friend.id ? "bg-primary text-black scale-105" : "bg-white/5 text-primary border border-primary/20"
                                        )}>
                                            {friend.username[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={cn("text-xs font-bold transition-colors", selectedFriendId === friend.id ? "text-white" : "text-text-muted")}>@{friend.username}</p>
                                            <p className="text-[0.55rem] font-mono text-text-muted/60">ACTIVE_LINK</p>
                                        </div>
                                    </button>
                                ))}
                                {(!friends || friends.length === 0) && (
                                    <p className="text-[0.6rem] text-text-muted italic text-center p-8 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">Isolated. Scan for nodes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Chat Area */}
                <section className="flex-1 flex flex-col bg-black relative">
                    {selectedFriend ? (
                        <>
                            {/* Chat Header */}
                            <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full border-2 border-primary/40 p-0.5 shadow-[0_0_15px_var(--accent-glow)]">
                                        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-black font-bold">
                                            {selectedFriend.username[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white leading-none mb-1">@{selectedFriend.username}</h2>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_var(--accent)]" />
                                            <span className="text-[0.6rem] font-mono text-primary/60 uppercase tracking-widest">ENCRYPTED_UPLINK</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => handleTradeProposal(selectedFriend)}
                                        className="h-10 px-6 text-[0.65rem] uppercase tracking-widest font-bold bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 shadow-[0_0_15px_var(--accent-glow)] transform hover:scale-105 transition-all"
                                        isLoading={isFetchingResources}
                                    >
                                        Stage Swap
                                    </Button>
                                    <button
                                        onClick={() => setRemoveModalOpen(true)}
                                        className="p-3 rounded-xl border border-white/5 text-text-muted hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 6L6 19M6 6l13 13" /></svg>
                                    </button>
                                </div>
                            </header>

                            {/* Interactions Log (Chat) */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar scrolling-touch">
                                {interactionsLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-[0.6rem] uppercase font-mono tracking-[0.5em]">Decrypting Interactions...</p>
                                    </div>
                                ) : (
                                    <div className="max-w-4xl mx-auto space-y-8">
                                        {interactions && interactions.length > 0 ? (
                                            interactions.map((interaction: any, idx: number) => {
                                                const isMine = interaction.interactionType === 'MESSAGE'
                                                    ? interaction.senderId === session.id
                                                    : interaction.initiatorId === session.id;

                                                if (interaction.interactionType === 'MESSAGE') {
                                                    return (
                                                        <div key={`msg-${interaction.id}-${idx}`} className={cn("flex", isMine ? "justify-end" : "justify-start animate-in slide-in-from-left-4 duration-500")}>
                                                            <div className={cn(
                                                                "max-w-[70%] p-4 rounded-2xl relative group",
                                                                isMine
                                                                    ? "bg-primary text-black font-medium shadow-[0_5px_15px_var(--accent-glow)] rounded-tr-none"
                                                                    : "bg-white/5 border border-white/5 text-white rounded-tl-none"
                                                            )}>
                                                                <p className="text-sm leading-relaxed">{interaction.content}</p>
                                                                <p className={cn("text-[0.55rem] mt-2 font-mono uppercase opacity-40", isMine ? "text-black" : "text-text-muted")}>
                                                                    {new Date(interaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                <div className={cn(
                                                                    "absolute top-0 w-2 h-2",
                                                                    isMine ? "right-0 translate-x-1 bg-primary" : "left-0 -translate-x-1 bg-white/5"
                                                                )} style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Trade Interaction Card
                                                const status = interaction.status || 'pending';
                                                return (
                                                    <div key={`trade-${interaction.id}-${idx}`} className={cn("flex w-full mb-4", isMine ? "justify-end" : "justify-start")}>
                                                        <div className={cn(
                                                            "w-full max-w-md p-6 rounded-2xl border-2 transition-all duration-500 backdrop-blur-md",
                                                            status === 'pending' ? "bg-white/[0.03] border-white/5 shadow-2xl" :
                                                                status === 'accepted' ? "bg-primary/[0.02] border-primary/30 shadow-[0_0_30px_var(--accent-glow)]" :
                                                                    "bg-red-500/[0.02] border-red-500/20 opacity-60"
                                                        )}>
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                                                                        status === 'pending' ? "bg-yellow-400" : status === 'accepted' ? "bg-primary" : "bg-red-500"
                                                                    )} />
                                                                    <h4 className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white">Barter Transmission</h4>
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[0.55rem] px-2 py-0.5 rounded-full border font-mono uppercase tracking-widest",
                                                                    status === 'pending' ? "text-yellow-400 border-yellow-400/30" :
                                                                        status === 'accepted' ? "text-primary border-primary/30" :
                                                                            "text-red-500 border-red-500/30"
                                                                )}>
                                                                    {status}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-6 relative">
                                                                <div className="space-y-2">
                                                                    <p className="text-[0.55rem] font-mono text-text-muted uppercase tracking-tighter">Providing</p>
                                                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                        <div className="text-xs font-bold text-white">OUTGOING</div>
                                                                        <div className="text-[0.6rem] text-text-muted font-mono">{isMine ? 'Your Assets' : `@${selectedFriend.username}'s Assets`}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-center">
                                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-text-muted rotate-90 sm:rotate-0">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l4 4-4 4" /><path d="M8 21l-4-4 4-4" /><path d="M20 7H4" /><path d="M4 17h16" /></svg>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2 text-right">
                                                                    <p className="text-[0.55rem] font-mono text-text-muted uppercase tracking-tighter">Requesting</p>
                                                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                                        <div className="text-xs font-bold text-white">INCOMING</div>
                                                                        <div className="text-[0.6rem] text-text-muted font-mono">{!isMine ? 'Your Assets' : `@${selectedFriend.username}'s Assets`}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-6 pt-6 border-t border-white/5 flex gap-3">
                                                                <Button
                                                                    variant="secondary"
                                                                    className="flex-1 h-9 text-[0.6rem] uppercase tracking-widest font-bold bg-white/5 border-white/10"
                                                                    onClick={() => handleInspectTrade(interaction.id)}
                                                                >
                                                                    Inspect Signal
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 grayscale">
                                                <div className="w-16 h-16 rounded-full border border-dashed border-primary flex items-center justify-center mb-6 animate-pulse">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                </div>
                                                <p className="font-mono text-[0.7rem] uppercase tracking-[0.4em]">Channel established. Awaiting signals.</p>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <footer className="p-8 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md transition-all">
                                    <input
                                        type="text"
                                        value={msgContent}
                                        onChange={(e) => setMsgContent(e.target.value)}
                                        placeholder={`Secure transmission to @${selectedFriend?.username}...`}
                                        className="flex-1 bg-transparent border-none px-4 py-3 text-sm text-white font-mono"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={!msgContent.trim() || sendMessage.isPending}
                                        className="h-11 px-8 uppercase tracking-[0.2em] font-bold"
                                    >
                                        Transmit
                                    </Button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center" style={{ backgroundImage: 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 70%)' }}>
                            <div className="w-32 h-32 rounded-full border border-primary/20 flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 rounded-full border border-primary/10 animate-ping duration-[3s]" />
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-widest uppercase">Select Frequency</h2>
                            <p className="text-text-muted font-mono text-[0.7rem] uppercase tracking-widest max-w-md mx-auto">Inter-node communication requires active frequency matching. Select a synced node from the perimeter to begin transmission.</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Modals */}
            {selectedFriend && tradeModalOpen && (
                <TradeModal
                    isOpen={tradeModalOpen}
                    onClose={() => setTradeModalOpen(false)}
                    receiverId={selectedFriend.id}
                    receiverUsername={selectedFriend.username}
                    resources={friendResources}
                    myResources={myResources?.filter((r: any) => r.status === 'available') || []}
                    defaultAll={false}
                    onSuccess={() => setTradeModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={removeModalOpen}
                onClose={() => setRemoveModalOpen(false)}
                onConfirm={handleRemoveConfirm}
                title="Disconnect Node?"
                message={`This will permanently sever the neural link with @${selectedFriend?.username}. No further transmission protocol will be possible until re-synced.`}
                confirmText="Sever Link"
                variant="danger"
                isLoading={removeFriendHook.isPending}
            />

            {tradeDetailModalOpen && selectedTradeId && (
                <TradeDetailModal
                    isOpen={tradeDetailModalOpen}
                    onClose={() => {
                        setTradeDetailModalOpen(false);
                        setSelectedTradeId(null);
                    }}
                    tradeId={selectedTradeId}
                    currentUserId={session.id}
                />
            )}

            <style>{`
                .text-glow-primary { text-shadow: 0 0 10px var(--accent-glow); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
