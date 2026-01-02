import React, { useState, useRef, useEffect } from 'react';
import { useUserSession } from '../hooks/useAuth';
import { useFriends, usePendingRequests, useOutboundRequests, useSendFriendRequest, useAcceptFriendRequest, useRejectFriendRequest, useInteractions, useSendMessage, useRemoveFriend } from '../hooks/useSocial';
import { useUserSearch } from '../hooks/useUsers';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SocialLoading } from '../components/SocialLoading';
import { TradeModal } from '../components/TradeModal';
import { TradeDetailModal } from '../components/TradeDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useResources } from '../hooks/useResources';
import { client } from '../lib/api';

export const Social: React.FC = () => {
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const { data: friends, isLoading: friendsLoading } = useFriends();
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

    const handleTradeProposal = async (user: any) => {
        setIsFetchingResources(true);
        try {
            const [{ data, error }] = await Promise.all([
                client.GET('/resources', {
                    params: { query: { ownerId: user.id.toString() } }
                }),
                refetchMyResources()
            ]);
            if (error) throw error;
            setFriendResources(data || []);
            setTradeModalOpen(true);
        } catch (err: any) {
            toast.error('Failed to scan node assets');
        } finally {
            setIsFetchingResources(false);
        }
    };

    const handleRemoveConfirm = async () => {
        if (!selectedFriend) return;
        try {
            await removeFriendHook.mutateAsync(selectedFriend.id);
            setRemoveModalOpen(false);
            setSelectedFriendId(null);
        } catch (err: any) {
            toast.error('Severing failed');
        }
    };

    if (sessionLoading || friendsLoading) return <SocialLoading message="Establishing Neural Link..." />;
    if (!session) return <div className="loading-screen">Unauthorized Signal</div>;

    return (
        <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-background">
            {/* Sidebar: Navigation & Discovery */}
            <aside className="w-80 border-r border-glass-surface flex flex-col bg-black/20">
                <div className="p-4 border-b border-glass-surface">
                    <div className="flex items-center gap-3 mb-4">
                        <Link to="/dashboard" className="text-text-muted hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </Link>
                        <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-glow-primary">Network</h1>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find User/Node..."
                            className="w-full h-9 bg-black/40 border border-white/5 rounded-md px-3 pr-8 text-xs font-mono focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                        />
                        {isSearching && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Search Results */}
                    {search.length >= 2 && (
                        <div className="p-2 space-y-1 border-b border-glass-surface bg-primary/5">
                            <p className="px-2 pb-1 text-[0.6rem] uppercase font-bold text-primary tracking-widest">Discovery Signals</p>
                            {searchResults?.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => !friends?.some(f => f.id === user.id) && handleSendRequest(user.id)}
                                    className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 transition-all text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-[0.6rem]" style={{ borderColor: user.themeColor || '#00ff9d', color: user.themeColor || '#00ff9d' }}>
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-text-main truncate">@{user.username}</span>
                                    </div>
                                    {friends?.some(f => f.id === user.id) ? (
                                        <span className="text-[0.5rem] text-primary uppercase">Linked</span>
                                    ) : outboundRequests?.some(r => r.id === user.id) ? (
                                        <span className="text-[0.5rem] text-blue-400 uppercase">Pending</span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Inbound Requests */}
                    {inboundRequests && inboundRequests.length > 0 && (
                        <div className="p-2 space-y-1 border-b border-glass-surface bg-secondary/5">
                            <p className="px-2 pb-1 text-[0.6rem] uppercase font-bold text-secondary tracking-widest">Inbound Signals</p>
                            {inboundRequests.map(req => (
                                <div key={req.id} className="p-2 rounded bg-black/20 border border-secondary/20 scale-in-center">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold">@{req.username}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleAccept(req.id)} className="p-1 hover:text-primary transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            </button>
                                            <button onClick={() => handleReject(req.id)} className="p-1 hover:text-red-400 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Active Friends */}
                    <div className="p-2 space-y-0.5">
                        <p className="px-2 py-2 text-[0.6rem] uppercase font-bold text-text-muted tracking-widest">Linked Nodes</p>
                        {friends?.map(friend => (
                            <button
                                key={friend.id}
                                onClick={() => setSelectedFriendId(friend.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group ${selectedFriendId === friend.id ? 'bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(0,255,157,0.1)]' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-lg flex-shrink-0"
                                    style={{ borderColor: friend.themeColor || '#00ff9d', color: friend.themeColor || '#00ff9d', backgroundColor: (friend.themeColor || '#00ff9d') + '11' }}
                                >
                                    {friend.username[0].toUpperCase()}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className={`text-sm font-bold truncate transition-colors ${selectedFriendId === friend.id ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                                        @{friend.username}
                                    </p>
                                    <p className="text-[0.65rem] text-text-muted truncate italic">
                                        {friend.bio || "Secure neural link established."}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {friends?.length === 0 && (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[0.6rem] text-text-muted uppercase tracking-widest font-mono">No nodes linked</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main View: Chat & Interactions */}
            <main className="flex-1 flex flex-col bg-background relative">
                {selectedFriend ? (
                    <>
                        {/* Header */}
                        <header className="h-16 border-b border-glass-surface flex items-center justify-between px-6 bg-black/20 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold"
                                    style={{ borderColor: selectedFriend.themeColor || '#00ff9d', color: selectedFriend.themeColor || '#00ff9d' }}
                                >
                                    {selectedFriend.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold">@{selectedFriend.username}</h2>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_#00ff9d]" />
                                        <span className="text-[0.6rem] uppercase tracking-tighter text-primary">Synchronized</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    className="h-8 px-3 text-[0.65rem] border border-primary/20 text-primary hover:bg-primary/10 transition-all uppercase tracking-widest"
                                    onClick={() => handleTradeProposal(selectedFriend)}
                                    isLoading={isFetchingResources}
                                >
                                    Propose Swap
                                </Button>
                                <button
                                    onClick={() => setRemoveModalOpen(true)}
                                    className="p-2 text-text-muted hover:text-red-400 transition-colors"
                                    title="Sever Connection"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                                </button>
                            </div>
                        </header>

                        {/* Interaction Timeline */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,183,255,0.03)_0%,transparent_100%)]">
                            {interactionsLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        <p className="text-[0.6rem] font-mono uppercase text-primary animate-pulse">Decrypting Interaction Log...</p>
                                    </div>
                                </div>
                            ) : !interactions || interactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    <p className="font-mono text-xs uppercase tracking-[0.3em]">No transmission history</p>
                                </div>
                            ) : (
                                interactions.map((item: any) => (
                                    <div key={`${item.interactionType}-${item.id}`} className={`flex ${item.senderId === session.id || item.initiatorId === session.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        {item.interactionType === 'MESSAGE' ? (
                                            <div className={`max-w-[70%] p-3 rounded-lg text-sm border ${item.senderId === session.id ? 'bg-primary/20 border-primary/30 rounded-tr-none' : 'bg-black/40 border-glass-surface rounded-tl-none'}`}>
                                                <p className="text-text-main leading-relaxed">{item.content}</p>
                                                <div className="mt-1 flex items-center justify-end gap-1 opacity-50">
                                                    <span className="text-[0.5rem] font-mono">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {item.senderId === session.id && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={item.isRead ? "text-primary" : "text-text-muted"}><polyline points="20 6 9 17 4 12" /></svg>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`w-full flex ${item.initiatorId === session.id ? 'justify-end' : 'justify-start'} my-2`}>
                                                <div className={`p-4 rounded-lg flex flex-col gap-3 min-w-[280px] max-w-[85%] border transition-all ${item.status === 'ACCEPTED' ? 'bg-primary/10 border-primary/40 shadow-[0_0_25px_rgba(0,255,157,0.1)]' :
                                                    item.status === 'REJECTED' || item.status === 'CANCELLED' ? 'bg-red-500/10 border-red-500/40 opacity-70' :
                                                        item.initiatorId === session.id
                                                            ? 'bg-secondary/10 border-secondary/30 shadow-[0_0_20px_rgba(0,183,255,0.05)]'
                                                            : 'bg-black/40 border-glass-surface'
                                                    } ${item.initiatorId === session.id ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-full ${item.status === 'ACCEPTED' ? 'bg-primary/20' :
                                                                item.status === 'REJECTED' || item.status === 'CANCELLED' ? 'bg-red-500/20' :
                                                                    item.initiatorId === session.id ? 'bg-secondary/20' : 'bg-white/5'
                                                                }`}>
                                                                {item.status === 'ACCEPTED' ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12" /></svg>
                                                                ) : item.status === 'REJECTED' || item.status === 'CANCELLED' ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={item.initiatorId === session.id ? "text-secondary" : "text-text-muted"}><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></svg>
                                                                )}
                                                            </div>
                                                            <span className={`text-[0.6rem] font-bold uppercase tracking-widest ${item.status === 'ACCEPTED' ? 'text-primary' :
                                                                item.status === 'REJECTED' || item.status === 'CANCELLED' ? 'text-red-500' :
                                                                    item.initiatorId === session.id ? 'text-secondary' : 'text-text-muted'
                                                                }`}>
                                                                {item.status === 'ACCEPTED' ? 'Barter Finalized' :
                                                                    item.status === 'REJECTED' ? 'Signal Dropped' :
                                                                        item.status === 'CANCELLED' ? 'Proposal Aborted' :
                                                                            'Barter Proposal'}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[0.55rem] px-2 py-0.5 rounded border uppercase tracking-tighter font-mono ${item.status === 'ACCEPTED' ? 'bg-primary/20 border-primary/40 text-primary' :
                                                            item.status === 'PENDING' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                                'bg-red-500/10 border-red-500/30 text-red-500'
                                                            }`}>
                                                            {item.status}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-text-muted leading-tight">
                                                        {item.status === 'ACCEPTED' ? (
                                                            item.initiatorId === session.id
                                                                ? `Swap with @${selectedFriend.username} fully synchronized.`
                                                                : `Link complete with @${selectedFriend.username}. Resources exchanged.`
                                                        ) : item.status === 'REJECTED' || item.status === 'CANCELLED' ? (
                                                            `The barter protocol was terminated.`
                                                        ) : (
                                                            item.initiatorId === session.id
                                                                ? `You requested assets from @${selectedFriend.username}`
                                                                : `@${selectedFriend.username} proposed a swap with you`
                                                        )}
                                                    </p>

                                                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                        <span className="text-[0.5rem] font-mono text-text-muted opacity-50">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            className={`h-7 px-4 text-[0.6rem] border ${item.status === 'ACCEPTED' ? 'border-primary/30 hover:bg-primary/10' :
                                                                item.status === 'REJECTED' || item.status === 'CANCELLED' ? 'border-glass-surface opacity-50' :
                                                                    item.initiatorId === session.id ? 'border-secondary/30 hover:bg-secondary/10' : 'border-glass-surface hover:bg-white/5'
                                                                }`}
                                                            onClick={() => handleInspectTrade(item.id)}
                                                        >
                                                            {item.status === 'PENDING' ? 'Inspect Signal' : 'View Breakdown'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-glass-surface bg-black/40 backdrop-blur-md">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={msgContent}
                                    onChange={(e) => setMsgContent(e.target.value)}
                                    placeholder={`Send transmission to @${selectedFriend.username}...`}
                                    className="flex-1 h-11 bg-white/5 border border-glass-surface rounded-full px-5 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={!msgContent.trim() || sendMessage.isPending}
                                    className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="-mr-1"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-24 h-24 mb-6 relative">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping" />
                            <div className="absolute inset-2 border-2 border-primary/10 rounded-full animate-ping [animation-delay:0.5s]" />
                            <div className="relative w-full h-full rounded-full border border-primary/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                            </div>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-glow-primary">Signal Awaiting Sync</h2>
                        <p className="text-text-muted text-sm max-w-sm font-mono uppercase tracking-widest leading-loose">
                            Select a node from the neural perimeter to begin synchronization logs.
                        </p>
                    </div>
                )}
            </main>

            {/* Modals */}
            {selectedFriend && tradeModalOpen && (
                <TradeModal
                    isOpen={tradeModalOpen}
                    onClose={() => setTradeModalOpen(false)}
                    receiverId={selectedFriend.id}
                    receiverUsername={selectedFriend.username}
                    resources={friendResources}
                    myResources={myResources?.filter((r: any) => r.ownerId === session.id && r.status === 'available') || []}
                    defaultAll={false}
                    onSuccess={() => setTradeModalOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={removeModalOpen}
                onClose={() => setRemoveModalOpen(false)}
                onConfirm={handleRemoveConfirm}
                title="Sever Neural Connection?"
                message={`This will permanently disconnect @${selectedFriend?.username}. You will lose visibility of their signal until re-synchronized.`}
                confirmText="Sever Connection"
                variant="danger"
                isLoading={removeFriendHook.isPending}
            />

            <TradeDetailModal
                isOpen={tradeDetailModalOpen}
                onClose={() => {
                    setTradeDetailModalOpen(false);
                    setSelectedTradeId(null);
                }}
                tradeId={selectedTradeId}
                currentUserId={session.id}
            />

            <style>{`
                .text-glow-primary {
                    text-shadow: 0 0 10px rgba(0, 255, 157, 0.4);
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
                    background: rgba(0, 255, 157, 0.2);
                }
                .scale-in-center {
                    animation: scale-in-center 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                @keyframes scale-in-center {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
