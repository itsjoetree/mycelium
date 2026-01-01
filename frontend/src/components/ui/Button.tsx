import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className,
    ...props
}) => {
    const variants = {
        primary: "bg-primary-dirty border-primary text-primary shadow-[0_0_15px_rgba(0,255,157,0.1)] hover:bg-primary hover:text-bg-deep hover:shadow-[0_0_30px_rgba(0,255,157,0.4)]",
        secondary: "bg-[rgba(191,0,255,0.1)] border-secondary text-secondary hover:bg-secondary hover:text-bg-deep hover:shadow-[0_0_30px_rgba(191,0,255,0.4)]",
        ghost: "bg-transparent text-text-muted hover:text-primary hover:bg-glass-surface",
        outline: "bg-transparent border-glass-surface text-text-muted hover:border-primary hover:text-primary"
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center px-6 py-3 rounded-sm font-medium transition-all duration-300 ease-elastic border border-transparent uppercase tracking-wider relative overflow-hidden text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:border-glass-surface",
                variants[variant],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className="loader"></span> : children}
        </button>
    );
};
