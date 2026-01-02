import React, { useState, useEffect } from 'react';
import { useResources } from '../hooks/useResources';
import { useUserSession } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

import { TradeModal } from '../components/TradeModal';
import { TradesList } from '../components/TradesList';
import { ResourceModal } from '../components/ResourceModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { UserMenu } from '../components/UserMenu';
import { Logo } from '../components/Logo';
import { useWebSocket } from '../hooks/useWebSocket';
import { MapView } from '../components/MapView';
import { NotificationBell } from '../components/NotificationBell';
import { useDeleteResource } from '../hooks/useResources';

export const Dashboard: React.FC = () => {
    useWebSocket();
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const [view, setView] = useState<'marketplace' | 'inventory'>('marketplace');
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

            // Check owner consistency
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

    if (sessionLoading) return <div className="loading-screen">Authenticating...</div>;
    if (!session) return <div className="loading-screen">Redirecting...</div>;

    const marketplaceResources = resources?.filter((r: any) => r.ownerId !== session.id && r.status === 'available') || [];
    const inventoryResources = resources?.filter((r: any) => r.ownerId === session.id) || [];
    const displayResources = view === 'marketplace' ? marketplaceResources : inventoryResources;

    return (
        <div className="p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 pb-2 border-b border-glass-surface">
                <div className="flex items-center gap-3">
                    <Logo className="w-10 h-10" />
                    <div className="text-2xl font-bold text-primary">Mycelium Network</div>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <UserMenu />
                </div>
            </header>

            <main>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex gap-2 p-1 bg-black/40 border border-glass-surface rounded-md">
                                <button
                                    onClick={() => setView('marketplace')}
                                    className={`px-4 py-1.5 text-xs uppercase font-bold tracking-widest rounded border transition-all duration-200
                                        ${view === 'marketplace'
                                            ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(0,255,157,0.1)]'
                                            : 'border-transparent text-text-muted hover:text-text'}`}
                                >
                                    Marketplace ({marketplaceResources.length})
                                </button>
                                <button
                                    onClick={() => {
                                        setView('inventory');
                                        setDisplayMode('grid');
                                    }}
                                    className={`px-4 py-1.5 text-xs uppercase font-bold tracking-widest rounded border transition-all duration-200
                                        ${view === 'inventory'
                                            ? 'bg-secondary/20 text-secondary border-secondary/30 shadow-[0_0_10px_rgba(0,183,255,0.1)]'
                                            : 'border-transparent text-text-muted hover:text-text'}`}
                                >
                                    My Inventory ({inventoryResources.length})
                                </button>
                            </div>

                            <Button onClick={() => setResourceModalOpen(true)}>
                                Add Resource
                            </Button>
                        </div>

                        {/* Search & Filtering */}
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search resources..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-glass-surface rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-mono"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute inset-y-0 right-3 flex items-center text-text-muted hover:text-text"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {['seed', 'compost', 'harvest', 'labor'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                                        className={`px-3 py-2 rounded-lg text-[0.6rem] uppercase font-bold tracking-[0.1em] border transition-all whitespace-nowrap
                                            ${typeFilter === type
                                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(0,255,157,0.15)]'
                                                : 'bg-black/20 border-glass-surface text-text-muted hover:border-text-muted'}`}
                                    >
                                        {type}s
                                    </button>
                                ))}
                                {typeFilter && (
                                    <button
                                        onClick={() => setTypeFilter(null)}
                                        className="px-2 py-2 text-[0.6rem] uppercase font-bold text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mb-6 flex items-center justify-between border-b border-glass-surface pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${view === 'marketplace' ? 'bg-primary' : 'bg-secondary'}`} />
                                {view === 'marketplace' ? 'Marketplace Signal Grid' : 'Personal Inventory'}
                            </h2>
                            {view === 'marketplace' && (
                                <div className="flex gap-2 p-0.5 bg-black/20 rounded border border-glass-surface">
                                    <button
                                        onClick={() => setDisplayMode('grid')}
                                        className={`p-1.5 rounded transition-all ${displayMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'}`}
                                        title="Grid View"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('map')}
                                        className={`p-1.5 rounded transition-all ${displayMode === 'map' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'}`}
                                        title="Map View"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={`mb-6 p-4 rounded-lg border transition-all duration-300 flex justify-between items-center min-h-[72px]
                            ${tradeBundle.length > 0
                                ? 'bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-4 shadow-[0_0_20px_rgba(0,255,157,0.05)]'
                                : 'bg-black/20 border-white/5 opacity-40'}`}>
                            {tradeBundle.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {tradeBundle.map(item => (
                                                <div key={item.id} className="w-8 h-8 rounded-full bg-black border border-primary flex items-center justify-center text-[0.6rem] font-bold text-primary shadow-lg ring-2 ring-black">
                                                    {item.title[0].toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-primary">Trade Bundle ({tradeBundle.length} items)</h4>
                                            <p className="text-[0.6rem] text-text-muted uppercase font-mono">Requesting from @{tradeBundle[0].ownerUsername || tradeBundle[0].ownerId}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="text-[0.6rem] h-8" onClick={clearBundle}>Clear</Button>
                                        <Button className="text-[0.6rem] h-8 px-6" onClick={openTrade}>Configure Proposal</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full border border-dashed border-text-muted/20 flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted/10" />
                                    </div>
                                    <div>
                                        <h4 className="text-[0.6rem] font-bold text-text-muted uppercase tracking-[0.2em]">Ready For Barter</h4>
                                        <p className="text-[0.55rem] text-text-muted italic font-mono">Select resources to begin assembling a trade proposal</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {displayMode === 'grid' ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                                {resourcesLoading ? (
                                    <p className="animate-pulse font-mono text-text-muted text-center py-12">Scanning network...</p>
                                ) : displayResources.length === 0 ? (
                                    <div className="col-span-full py-12 text-center border border-dashed border-glass-surface rounded-lg">
                                        <p className="text-text-muted font-mono mb-2">No resources found in this sector</p>
                                        <p className="text-[0.6rem] text-text-muted uppercase tracking-[0.2em]">Awaiting signal...</p>
                                    </div>
                                ) : displayResources.map((res: any) => (
                                    <Card key={res.id} className="transition-transform duration-300 ease-elastic hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,255,157,0.1)] hover:border-primary">
                                        <div className="flex justify-between mb-2">
                                            <span className={`text-[0.7rem] uppercase px-1.5 py-0.5 rounded border border-current 
                                                ${res.type === 'seed' ? 'text-[#f9e076]' :
                                                    res.type === 'compost' ? 'text-[#a97142]' :
                                                        res.type === 'harvest' ? 'text-[#ff6b6b]' : 'text-[#74c0fc]'}`}>
                                                {res.type}
                                            </span>
                                            <span className="font-mono text-text-muted text-[0.6rem] flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-primary/40" />
                                                @{res.ownerUsername || res.ownerId}
                                            </span>
                                        </div>
                                        <h3 className="text-lg mb-1">{res.title}</h3>
                                        <div className="mb-4">
                                            <span className="text-2xl font-bold block">{res.quantity} {res.unit}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {res.ownerId === session?.id ? (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        className="flex-1 text-xs"
                                                        onClick={() => openEdit(res)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className="px-3 text-red-500 hover:text-red-400"
                                                        onClick={() => handleDeleteClick(res.id)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    variant={tradeBundle.find(item => item.id === res.id) ? "primary" : "secondary"}
                                                    className="w-full text-xs"
                                                    onClick={() => toggleBundleItem(res)}
                                                    disabled={res.status !== 'available'}
                                                >
                                                    {tradeBundle.find(item => item.id === res.id) ? "Item Added" : "Add to Bundle"}
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
                        <div className="sticky top-8">
                            <h2 className="mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                Network Activity
                            </h2>
                            <TradesList />
                        </div>
                    </aside>
                </div>

                {tradeBundle.length > 0 && tradeModalOpen && (
                    <TradeModal
                        isOpen={tradeModalOpen}
                        onClose={() => {
                            setTradeModalOpen(false);
                        }}
                        receiverId={tradeBundle[0].ownerId}
                        receiverUsername={tradeBundle[0].ownerUsername}
                        resources={tradeBundle}
                        myResources={inventoryResources.filter((r: any) => r.status === 'available')}
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
                    title="Remove Signal?"
                    message="This will permanently disconnect this resource from the network. This action cannot be undone."
                    confirmText="Disconnect"
                    variant="danger"
                    isLoading={deleteResource.isPending}
                />
            </main>

            <style>{`
                .loading-screen {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-primary);
                    font-family: var(--font-mono);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse { 50% { opacity: 0.5; } }
            `}</style>
        </div>
    );
};
