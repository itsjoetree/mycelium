import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';

export const GlobalLoading: React.FC<{ message?: string }> = ({ message }) => {
    const { t } = useTranslation();
    const displayMessage = message || t('common.connecting', 'Connecting to Mycelium...');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden">
            {/* Minimalist Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative">
                {/* Outer Ring */}
                <div className="w-32 h-32 border border-white/5 rounded-full animate-ping-slow" />
                <div className="absolute inset-0 w-32 h-32 border border-white/10 rounded-full animate-spin-slow border-t-white/40" />

                {/* Logo with Glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                        <Logo className="w-12 h-12 text-white opacity-80" />
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center space-y-3">
                <h2 className="text-white/30 font-mono text-[0.6rem] tracking-[0.6em] uppercase animate-pulse">{displayMessage}</h2>
                <div className="flex gap-1.5 justify-center">
                    <div className="w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-white/20 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-white/20 rounded-full animate-bounce" />
                </div>
            </div>

            <style>{`
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.1); opacity: 0.1; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                .animate-ping-slow {
                    animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 4s linear infinite;
                }
            `}</style>
        </div>
    );
};
