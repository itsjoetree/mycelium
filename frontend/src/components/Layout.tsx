import React from 'react';
import { Sidebar } from './Sidebar';
import { useUserSession } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { data: session } = useUserSession();
    const location = useLocation();

    // Don't show sidebar if not logged in OR if on login page
    if (!session || location.pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-black text-text-main overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-64 h-screen flex flex-col relative overflow-hidden">
                {children}
            </main>
        </div>
    );
};
