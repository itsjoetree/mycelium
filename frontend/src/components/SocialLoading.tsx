import React from 'react';

export const SocialLoading: React.FC<{ message?: string }> = ({ message = 'Synchronizing Social Fabric...' }) => {
    return (
        <div className="fixed inset-0 bg-bg-deep z-[100] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Binary Rain Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden font-mono text-[10px] text-primary leading-none whitespace-pre bubble-mask">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className="animate-binary-rain" style={{ animationDelay: `${Math.random() * 5}s`, animationDuration: `${5 + Math.random() * 10}s` }}>
                        {Array.from({ length: 100 }).map(() => (Math.random() > 0.5 ? '1' : '0')).join(' ')}
                    </div>
                ))}
            </div>

            {/* Scanning Line */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-20 w-full animate-scan-line pointer-events-none" />

            {/* Central Animation */}
            <div className="relative">
                <div className="w-32 h-32 border-2 border-primary/20 rounded-full animate-ping-slow" />
                <div className="absolute inset-0 w-32 h-32 border-2 border-primary/40 rounded-full animate-spin-slow border-t-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/50 shadow-[0_0_20px_rgb(var(--accent-rgb)/0.3)]">
                        <div className="w-8 h-8 text-primary animate-pulse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <polyline points="16 11 18 13 22 9" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center space-y-2">
                <h2 className="text-primary font-mono text-sm tracking-[0.3em] uppercase animate-pulse">{message}</h2>
                <div className="flex gap-1 justify-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                </div>
            </div>

            <style>{`
                @keyframes binary-rain {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                .animate-binary-rain {
                    animation: binary-rain linear infinite;
                }
                @keyframes scan-line {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                .animate-scan-line {
                    animation: scan-line 4s linear infinite;
                }
                .animate-ping-slow {
                    animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                .bubble-mask {
                    mask-image: radial-gradient(circle, black 20%, transparent 80%);
                }
            `}</style>
        </div>
    );
};
