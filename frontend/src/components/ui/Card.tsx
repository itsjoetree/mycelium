import React from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({ children, className, style }) => {
    return (
        <div className={cn(
            "bg-glass-surface border border-primary-dirty backdrop-blur-md rounded-md p-8 shadow-2xl relative",
            className
        )} style={style}>
            {/* Gradient overlay mimicking ::before */}
            <div className="absolute inset-[-1px] rounded-md bg-gradient-to-tr from-transparent via-[rgba(0,255,157,0.1)] to-transparent -z-10 opacity-50 pointer-events-none" />
            {children}
        </div>
    );
};
