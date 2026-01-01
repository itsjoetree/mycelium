import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useCreateTrade } from '../hooks/useTrades';
import { toast } from 'sonner';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiverId: number;
    receiverUsername: string;
    resourceTitle: string;
    resourceId: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({
    isOpen, onClose, receiverId, receiverUsername, resourceTitle, resourceId
}) => {
    const queryClient = useQueryClient();
    const createTrade = useCreateTrade();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTrade = async () => {
        setIsSubmitting(true);
        try {
            await createTrade.mutateAsync({
                receiverId,
                resourceIds: [resourceId] // For demo, just trading for this one resource
            });
            toast.success(`Trade proposed for ${resourceTitle}`);
            queryClient.invalidateQueries({ queryKey: ['trades'] });
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Trade failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000]">
            <Card className="w-full max-w-sm border-primary shadow-[0_0_50px_rgba(0,255,157,0.2)]">
                <h3 className="mb-2">Request {resourceTitle}</h3>
                <p className="mb-8 text-text-muted font-mono">Propose a trade with @{receiverUsername || receiverId}</p>

                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={handleTrade} isLoading={isSubmitting}>Confirm Proposal</Button>
                </div>
            </Card>
        </div>
    );
};
