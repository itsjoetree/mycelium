import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Organic Mycelium Network Path */}
            <path
                d="M50 20C50 20 55 35 65 40C75 45 85 45 85 45M50 20C50 20 45 35 35 40C25 45 15 45 15 45M50 20L50 80M50 50C50 50 60 55 70 65C80 75 80 85 80 85M50 50C50 50 40 55 30 65C20 75 20 85 20 85"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-primary animate-pulse"
            />

            {/* Node points */}
            <circle cx="50" cy="20" r="6" fill="currentColor" className="text-secondary shadow-[0_0_10px_currentColor]" />
            <circle cx="85" cy="45" r="4" fill="currentColor" className="text-primary" />
            <circle cx="15" cy="45" r="4" fill="currentColor" className="text-primary" />
            <circle cx="80" cy="85" r="4" fill="currentColor" className="text-primary" />
            <circle cx="20" cy="85" r="4" fill="currentColor" className="text-primary" />
            <circle cx="50" cy="80" r="4" fill="currentColor" className="text-secondary" />

            {/* Subtle glow filter */}
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
};
