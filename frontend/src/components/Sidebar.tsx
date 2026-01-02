import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserSession, useLogout } from '../hooks/useAuth';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from './Logo';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export const Sidebar: React.FC = () => {
    const { data: session } = useUserSession();
    const logout = useLogout();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    if (!session) return null;

    const navItems = [
        {
            label: 'Marketplace',
            path: '/dashboard',
            search: '?view=marketplace',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
            )
        },
        {
            label: 'Inventory',
            path: '/dashboard',
            search: '?view=inventory',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
            )
        },
        {
            label: 'Network',
            path: '/social',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            )
        }
    ];

    const handleLogout = async () => {
        try {
            await logout.mutateAsync();
            toast.success('Neural link severed');
            navigate('/login');
        } catch (err: any) {
            toast.error('Logout protocol failed');
        }
    };

    return (
        <aside className="w-64 h-screen bg-black border-r border-glass-surface flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <Logo className="w-10 h-10 shadow-[0_0_20px_var(--accent-glow)]" />
                    <div>
                        <h1 className="text-sm font-bold tracking-[.3em] text-white uppercase">Mycelium</h1>
                        <p className="text-[0.5rem] text-primary/60 font-mono -mt-1 uppercase tracking-tighter">Decentralized Protocol</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isDashboard = location.pathname === '/dashboard';
                    const isMarketplace = item.label === 'Marketplace';

                    // Special case: Marketplace is active if on dashboard and view is either marketplace or missing
                    const isActive = location.pathname === item.path && (
                        (!item.search && !location.search) ||
                        (location.search === item.search) ||
                        (isDashboard && isMarketplace && (!location.search || location.search === '?view=marketplace'))
                    );
                    return (
                        <Link
                            key={item.label + (item.search || '')}
                            to={item.path + (item.search || '')}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "text-primary bg-primary/10 border border-primary/20 shadow-[0_0_20px_var(--accent-glow)]"
                                    : "text-text-muted hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <span className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
                                {item.icon}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                            {isActive && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-primary shadow-[0_0_10px_var(--accent)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Area */}
            <div className="p-4 border-t border-glass-surface relative">
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                    <div className="w-10 h-10 rounded-full border-2 border-primary/40 flex items-center justify-center bg-primary/10 relative">
                        <span className="text-primary font-bold text-sm">{session.username[0].toUpperCase()}</span>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-black animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">@{session.username}</p>
                        <p className="text-[0.6rem] text-text-muted font-mono truncate">NODE_{session.id.toString().padStart(4, '0')}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("text-text-muted transition-transform", isProfileOpen && "rotate-180")}><path d="m18 15-6-6-6 6" /></svg>
                </button>

                {isProfileOpen && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-bg-surface border border-glass-surface rounded-xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest">Settings</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            <span className="text-[0.65rem] font-bold uppercase tracking-widest">Sever Link</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};
