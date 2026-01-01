import React, { useState } from 'react';
import { useResources } from '../hooks/useResources';
import { useUserSession } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

import { TradeModal } from '../components/TradeModal';
import { TradesList } from '../components/TradesList';
import { ResourceModal } from '../components/ResourceModal';
import { UserMenu } from '../components/UserMenu';
import { Logo } from '../components/Logo';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
    useWebSocket();
    const { data: session, isLoading: sessionLoading } = useUserSession();
    const { data: resources, isLoading: resourcesLoading } = useResources();

    // Resource Modal State
    const [resourceModalOpen, setResourceModalOpen] = useState(false);

    // Trade Modal State
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<{ id: number, title: string, ownerId: number, ownerUsername: string } | null>(null);

    // Filter State
    const [view, setView] = useState<'marketplace' | 'inventory'>('marketplace');

    const openTrade = (res: any) => {
        if (res.ownerId === session?.id) {
            toast.error("You already own this resource");
            return;
        }
        setSelectedResource({
            id: res.id,
            title: res.title,
            ownerId: res.ownerId,
            ownerUsername: res.ownerUsername || `Node #${res.ownerId}`
        });
        setTradeModalOpen(true);
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
                <UserMenu />
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
                                    onClick={() => setView('inventory')}
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
                                    <Button
                                        variant={res.ownerId === session?.id ? 'outline' : 'secondary'}
                                        className="w-full text-xs"
                                        onClick={() => openTrade(res)}
                                        disabled={res.ownerId === session?.id || res.status !== 'available'}
                                    >
                                        {res.ownerId === session?.id ? 'Owned Asset' : 'Initiate Trade'}
                                    </Button>
                                </Card>
                            ))}
                        </div>
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

                {selectedResource && (
                    <TradeModal
                        isOpen={tradeModalOpen}
                        onClose={() => setTradeModalOpen(false)}
                        receiverId={selectedResource.ownerId}
                        receiverUsername={selectedResource.ownerUsername}
                        resourceId={selectedResource.id}
                        resourceTitle={selectedResource.title}
                    />
                )}

                <ResourceModal
                    isOpen={resourceModalOpen}
                    onClose={() => setResourceModalOpen(false)}
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
