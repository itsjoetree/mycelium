import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    className,
    ...props
}) => {
    const variants = {
        primary: "bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_var(--accent-glow)] hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_25px_var(--accent-glow)]",
        secondary: "bg-[rgba(191,0,255,0.05)] border-[#bf00ff]/20 text-[#bf00ff] hover:bg-[#bf00ff]/10 hover:border-[#bf00ff]/40",
        ghost: "bg-transparent text-text-muted hover:text-primary hover:bg-primary/5",
        outline: "bg-transparent border-glass-surface text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5"
    };

    const sizes = {
        sm: "px-3 py-1 text-[0.65rem]",
        md: "px-6 py-3 text-sm"
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-sm font-medium transition-all duration-300 ease-elastic border border-transparent uppercase tracking-wider relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:border-glass-surface",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className="loader"></span> : children}
        </button>
    );
};
