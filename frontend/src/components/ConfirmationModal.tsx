import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    variant = 'primary'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
            <Card className={`w-full max-w-md border-glass-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] ${variant === 'danger' ? 'border-red-500/50' : 'border-primary/50'}`}>
                <h2 className={`mb-4 ${variant === 'danger' ? 'text-red-500' : 'text-primary'}`}>{title}</h2>
                <p className="text-text-main mb-8 font-mono text-sm leading-relaxed">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className={variant === 'danger' ? 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30' : ''}
                    >
                        {confirmText}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
