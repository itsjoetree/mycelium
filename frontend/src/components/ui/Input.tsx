import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
    return (
        <div className="flex flex-col gap-1 mb-4">
            {label && <label className="text-xs uppercase text-text-muted tracking-wider font-semibold">{label}</label>}
            <input
                className={cn(
                    "bg-[rgba(5,20,18,0.6)] border border-primary-dirty px-4 py-3 rounded-sm text-text-main font-mono outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_15px_rgb(var(--accent-rgb)/0.1)] focus:bg-[rgba(5,20,18,0.8)]",
                    error && 'border-tertiary',
                    className
                )}
                {...props}
            />
            {error && <span className="text-tertiary text-xs">{error}</span>}
        </div>
    );
};
