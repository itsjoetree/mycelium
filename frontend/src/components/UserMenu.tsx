import React, { useState } from 'react';
import { useUserSession, useLogout } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export const UserMenu: React.FC = () => {
    const { data: session } = useUserSession();
    const logout = useLogout();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout.mutateAsync();
            toast.success('Logged out');
            navigate('/login');
        } catch (err: any) {
            toast.error('Logout failed');
        }
    };

    if (!session) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm hover:bg-glass-surface transition-colors duration-200 border border-transparent hover:border-glass-surface"
            >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <span className="text-primary font-mono text-xs uppercase">{session.username[0]}</span>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-text-main leading-tight">{session.username}</div>
                    <div className="text-[0.6rem] text-text-muted font-mono leading-tight">Node #{session.id}</div>
                </div>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-bg-deep border border-glass-surface shadow-2xl z-50 py-1 rounded-sm animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="px-4 py-3 border-b border-glass-surface mb-1">
                            <div className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">User Detail</div>
                            <div className="text-sm font-mono truncate">{session.email}</div>
                        </div>

                        <Link
                            to="/social"
                            className="block px-4 py-2 text-sm hover:bg-primary hover:text-bg-deep transition-colors duration-200"
                            onClick={() => setIsOpen(false)}
                        >
                            Social Network
                        </Link>

                        <Link
                            to="/settings"
                            className="block px-4 py-2 text-sm hover:bg-primary hover:text-bg-deep transition-colors duration-200"
                            onClick={() => setIsOpen(false)}
                        >
                            Settings
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-secondary hover:bg-secondary hover:text-bg-deep transition-colors duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
