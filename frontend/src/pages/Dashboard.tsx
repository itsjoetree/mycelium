import React, { useState, useEffect } from 'react';
import { useResources, useDeleteResource } from '../hooks/useResources';
import { useUserSession } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

import { TradeModal } from '../components/TradeModal';
import { TradesList } from '../components/TradesList';
import { ResourceModal } from '../components/ResourceModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useWebSocket } from '../hooks/useWebSocket';
import { MapView } from '../components/MapView';
import { GlobalLoading } from '../components/GlobalLoading';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export const Dashboard: React.FC = () => {
    useWebSocket();
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const [searchParams] = useSearchParams();
    const view = (searchParams.get('view') as 'marketplace' | 'inventory') || 'marketplace';
    const [displayMode, setDisplayMode] = useState<'grid' | 'map'>('grid');

    // Filter State
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: resources, isLoading: resourcesLoading } = useResources({
        search: debouncedSearch || undefined,
        type: typeFilter || undefined
    });

    // Resource Modal State
    const [resourceModalOpen, setResourceModalOpen] = useState(false);
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<any>(null);

    // Deletion Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<number | null>(null);

    // Bundle State
    const [tradeBundle, setTradeBundle] = useState<any[]>([]);

    const deleteResource = useDeleteResource();

    const toggleBundleItem = (res: any) => {
        if (res.ownerId === session?.id) {
            toast.error("You already own this resource");
            return;
        }

        setTradeBundle(prev => {
            const exists = prev.find(item => item.id === res.id);
            if (exists) {
                return prev.filter(item => item.id !== res.id);
            }

            if (prev.length > 0 && prev[0].ownerId !== res.ownerId) {
                toast.error(`You can only bundle items from @${prev[0].ownerUsername || prev[0].ownerId} in this trade`);
                return prev;
            }

            return [...prev, res];
        });
    };

    const clearBundle = () => setTradeBundle([]);

    const openTrade = () => {
        if (tradeBundle.length === 0) return;
        setTradeModalOpen(true);
    };

    const openEdit = (res: any) => {
        setSelectedResource(res);
        setResourceModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setResourceToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!resourceToDelete) return;
        try {
            await deleteResource.mutateAsync(resourceToDelete);
            toast.success("Signal removed");
            setDeleteModalOpen(false);
            setResourceToDelete(null);
        } catch (err: any) {
            toast.error(err?.message || "Failed to remove signal");
        }
    };

    if (sessionLoading) return <GlobalLoading message="LINKING NEURAL PERIMETER..." />;
    if (!session) return null;

    const marketplaceResources = resources?.filter((r: any) => r.ownerId !== session.id && r.status === 'available') || [];
    const inventoryResources = resources?.filter((r: any) => r.ownerId === session.id) || [];
    const displayResources = view === 'marketplace' ? marketplaceResources : inventoryResources;

    return (
        <div className="flex-1 flex flex-col h-full bg-black overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-10 pt-8">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                                {view === 'marketplace' ? 'CENTRAL HUB' : 'INVENTORY'}
                            </h1>
                            <p className="text-text-muted font-mono text-[0.6rem] uppercase tracking-[0.4em]">
                                {view === 'marketplace' ? 'Browse Global Resource Signals' : 'Managing Personal Assets'}
                            </p>
                        </div>
                        <Button
                            onClick={() => setResourceModalOpen(true)}
                            className="scale-105"
                        >
                            Register New Asset
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-8">
                            {/* Search & Filtering */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Scan resource frequencies..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-glass-surface rounded-xl py-3 pl-10 pr-4 text-sm font-mono"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {['seed', 'compost', 'harvest', 'labor'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                                            className={`px-4 py-2 rounded-xl text-[0.6rem] uppercase font-bold tracking-[0.2em] border transition-all whitespace-nowrap
                                                ${typeFilter === type
                                                    ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_var(--accent-glow)]'
                                                    : 'bg-black/40 border-glass-surface text-text-muted hover:border-text-muted'}`}
                                        >
                                            {type}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-glass-surface pb-4">
                                <h2 className="text-xl font-bold flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--accent)]" />
                                    <span className="tracking-widest capitalize">{view} Grid</span>
                                </h2>
                                {view === 'marketplace' && (
                                    <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-glass-surface">
                                        <button
                                            onClick={() => setDisplayMode('grid')}
                                            className={`p-2 rounded-md transition-all ${displayMode === 'grid' ? 'bg-primary/20 text-primary shadow-inner' : 'text-text-muted hover:text-text'}`}
                                            title="Grid View"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
                                        </button>
                                        <button
                                            onClick={() => setDisplayMode('map')}
                                            className={`p-2 rounded-md transition-all ${displayMode === 'map' ? 'bg-primary/20 text-primary shadow-inner' : 'text-text-muted hover:text-text'}`}
                                            title="Map View"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Trade Bundle Bar */}
                            <div className={`mb-6 p-4 rounded-xl border transition-all duration-500 flex justify-between items-center min-h-[80px]
                                ${tradeBundle.length > 0
                                    ? 'bg-primary/5 border-primary/30 shadow-[0_0_30px_var(--accent-glow)] scale-[1.01]'
                                    : 'bg-white/5 border-white/5 opacity-40'}`}>
                                {tradeBundle.length > 0 ? (
                                    <>
                                        <div className="flex items-center gap-6">
                                            <div className="flex -space-x-3">
                                                {tradeBundle.map((item, idx) => (
                                                    <div key={item.id}
                                                        className="w-10 h-10 rounded-full bg-black border-2 border-primary flex items-center justify-center text-[0.7rem] font-bold text-primary shadow-xl ring-4 ring-black transform hover:scale-110 transition-transform cursor-help"
                                                        style={{ zIndex: 10 - idx }}
                                                        title={item.title}
                                                    >
                                                        {item.title[0].toUpperCase()}
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Protocol Staged</h4>
                                                <p className="text-[0.6rem] text-primary font-mono uppercase">Target: @{tradeBundle[0].ownerUsername || 'NODE_' + tradeBundle[0].ownerId}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="ghost" className="text-[0.6rem] h-9 px-4 uppercase tracking-widest border-white/10" onClick={clearBundle}>Abort</Button>
                                            <Button className="text-[0.6rem] h-9 px-8 uppercase tracking-[0.2em] font-bold" onClick={openTrade}>Initialize Swap</Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-white/5 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-[0.6rem] font-bold text-text-muted uppercase tracking-[0.2em]">Ready For Barter</h4>
                                            <p className="text-[0.55rem] text-text-muted/60 italic font-mono uppercase tracking-tighter">Select resources to stage a transmission protocol</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {displayMode === 'grid' ? (
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                                    {resourcesLoading ? (
                                        <div className="col-span-full py-20 text-center">
                                            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                            <p className="font-mono text-[0.7rem] uppercase text-primary animate-pulse tracking-widest">Scanning Neural Channels...</p>
                                        </div>
                                    ) : displayResources.length === 0 ? (
                                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                            <div className="mb-4 opacity-20 flex justify-center text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20" /><path d="m4.93 4.93 14.14 14.14" /><path d="m4.93 19.07 14.14-14.14" /></svg>
                                            </div>
                                            <p className="text-text-muted font-mono mb-2 uppercase tracking-widest text-sm">No signals detected</p>
                                            <p className="text-[0.6rem] text-text-muted/40 uppercase tracking-[0.4em]">Sector silent</p>
                                        </div>
                                    ) : displayResources.map((res: any) => (
                                        <Card key={res.id} className="group hover:-translate-y-2 transition-all duration-500 border-white/5 hover:border-primary/40 bg-white/[0.02] hover:bg-white/[0.05] p-5 !rounded-2xl shadow-2xl relative overflow-hidden">
                                            <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                                            <div className="flex justify-between items-start mb-4 relative z-10">
                                                <span className={cn(
                                                    "text-[0.6rem] uppercase px-3 py-1 rounded-full border font-bold tracking-widest",
                                                    res.type === 'seed' ? 'text-[#f9e076] border-[#f9e076]/30 bg-[#f9e076]/5' :
                                                        res.type === 'compost' ? 'text-[#a97142] border-[#a97142]/30 bg-[#a97142]/5' :
                                                            res.type === 'harvest' ? 'text-[#ff6b6b] border-[#ff6b6b]/30 bg-[#ff6b6b]/5' :
                                                                'text-[#74c0fc] border-[#74c0fc]/30 bg-[#74c0fc]/5'
                                                )}>
                                                    {res.type}
                                                </span>
                                                <button className="text-text-muted hover:text-primary transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                                </button>
                                            </div>

                                            <h3 className="text-xl font-bold mb-1 text-white group-hover:text-primary transition-colors">{res.title}</h3>
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                <span className="text-[0.65rem] font-mono text-text-muted uppercase tracking-tighter">Node: @{res.ownerUsername || res.ownerId}</span>
                                            </div>

                                            <div className="mb-8 p-3 bg-black/40 rounded-xl border border-white/5">
                                                <span className="text-3xl font-bold block text-white tabular-nums tracking-tight">{res.quantity} <span className="text-xs text-text-muted uppercase font-mono font-normal tracking-[.2em]">{res.unit}</span></span>
                                            </div>

                                            <div className="flex gap-2 relative z-10">
                                                {res.ownerId === session?.id ? (
                                                    <>
                                                        <Button
                                                            variant="primary"
                                                            className="flex-1 text-[0.65rem] h-10 uppercase tracking-widest font-bold bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
                                                            onClick={() => openEdit(res)}
                                                        >
                                                            Modify
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-10 h-10 p-0 text-red-500 hover:text-white hover:bg-red-500/20 border border-white/5"
                                                            onClick={() => handleDeleteClick(res.id)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="primary"
                                                        className={cn(
                                                            "w-full text-[0.65rem] h-10 uppercase tracking-widest font-bold",
                                                            tradeBundle.find(item => item.id === res.id)
                                                                ? "bg-primary border-transparent text-black"
                                                                : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                                        )}
                                                        onClick={() => toggleBundleItem(res)}
                                                        disabled={res.status !== 'available'}
                                                    >
                                                        {tradeBundle.find(item => item.id === res.id) ? "Staged for Swap" : "Add to Proposal"}
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <MapView
                                    key={view}
                                    resources={displayResources}
                                    currentUserId={session?.id}
                                    onInitiateTrade={toggleBundleItem}
                                    selectedIds={tradeBundle.map(i => i.id)}
                                />
                            )}
                        </div>

                        <aside className="lg:col-span-1">
                            <div className="sticky top-8 space-y-8">
                                <div className="p-1 px-4 border-l-2 border-primary bg-primary/5">
                                    <h2 className="text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--accent)]" />
                                        Network Updates
                                    </h2>
                                </div>
                                <div className="max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
                                    <TradesList />
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {tradeBundle.length > 0 && tradeModalOpen && (
                <TradeModal
                    isOpen={tradeModalOpen}
                    onClose={() => setTradeModalOpen(false)}
                    receiverId={tradeBundle[0].ownerId}
                    receiverUsername={tradeBundle[0].ownerUsername}
                    resources={tradeBundle}
                    myResources={inventoryResources.filter((r: any) => r.status === 'available')}
                    defaultAll={true}
                    onSuccess={clearBundle}
                />
            )}

            <ResourceModal
                isOpen={resourceModalOpen}
                onClose={() => {
                    setResourceModalOpen(false);
                    setSelectedResource(null);
                }}
                initialData={view === 'inventory' ? selectedResource : null}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setResourceToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Disconnect Signal?"
                message="This will permanently sever this resource's uplink to the decentralized network. This transmission cannot be recovered."
                confirmText="Sever Link"
                variant="danger"
                isLoading={deleteResource.isPending}
            />

            <style>{`
                .text-glow-primary {
                    text-shadow: 0 0 15px var(--accent-glow);
                }
                .ease-elastic {
                    transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .loading-screen {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    letter-spacing: 0.5em;
                }
            `}</style>
        </div>
    );
};
