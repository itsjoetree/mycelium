import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface SocialLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: number;
        username: string;
        themeColor?: string | null;
    };
}

export const SocialLogsModal: React.FC<SocialLogsModalProps> = ({ isOpen, onClose, user }) => {
    const [logs, setLogs] = useState<{ id: string; timestamp: string; message: string; type: 'info' | 'success' | 'warning' }[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Generate some thematic logs
            const baseLogs = [
                { id: '1', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), message: 'Initial handshake protocol initiated.', type: 'info' as const },
                { id: '2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), message: 'Neural path synchronization established.', type: 'success' as const },
                { id: '3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), message: 'Encryption keys exchanged successfully.', type: 'info' as const },
                { id: '4', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), message: 'High-frequency signal detected in sector.', type: 'warning' as const },
                { id: '5', timestamp: new Date().toISOString(), message: 'Terminal session active.', type: 'success' as const },
            ];
            setLogs(baseLogs);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-2xl bg-bg-deep border-primary/30 p-0 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgb(var(--accent-rgb)/0.5)]"
                            style={{ backgroundColor: user.themeColor || '#00ff9d' }}
                        />
                        <h2 className="text-sm font-bold uppercase tracking-widest font-mono">
                            Connection Logs: @{user.username}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 font-mono text-[0.7rem] space-y-4 bg-black/20">
                    <div className="grid grid-cols-3 gap-4 mb-6 text-text-muted uppercase text-[0.6rem] tracking-tighter">
                        <div className="p-2 border border-white/5 rounded bg-white/5">
                            <p>Handshake</p>
                            <p className="text-primary font-bold">STABLE</p>
                        </div>
                        <div className="p-2 border border-white/5 rounded bg-white/5">
                            <p>Latency</p>
                            <p className="text-primary font-bold">14ms</p>
                        </div>
                        <div className="p-2 border border-white/5 rounded bg-white/5">
                            <p>Uptime</p>
                            <p className="text-primary font-bold">99.98%</p>
                        </div>
                    </div>

                    <div className="space-y-1.5 border-l border-white/10 pl-4 py-2">
                        {logs.map((log) => (
                            <div key={log.id} className="group flex gap-3">
                                <span className="text-text-muted/40 whitespace-nowrap">
                                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                                <span className={`
                                    ${log.type === 'success' ? 'text-primary' : log.type === 'warning' ? 'text-tertiary' : 'text-text-main'}
                                `}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                        <div className="flex gap-3 animate-pulse">
                            <span className="text-text-muted/40">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                            <span className="text-primary">Awaiting signal payload...</span>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-[0.6rem] uppercase tracking-widest text-text-muted mb-3 border-b border-white/5 pb-1">Inter-Node Interaction Data</h4>
                        <div className="p-8 text-center border border-dashed border-white/5 rounded opacity-50 italic text-text-muted">
                            No persistent trade history detected in this sector.
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="text-xs uppercase px-6">Close</Button>
                    <Button className="text-xs uppercase px-6">Export Data</Button>
                </div>
            </Card>
        </div>
    );
};
