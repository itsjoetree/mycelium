import React, { useState } from 'react';
import { useCreateResource } from '../hooks/useResources';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({ isOpen, onClose }) => {
    const createResource = useCreateResource();
    const [newResource, setNewResource] = useState({
        title: '',
        quantity: 10,
        unit: 'kg',
        type: 'seed' as const
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createResource.mutateAsync({
                ...newResource,
                latitude: 0,
                longitude: 0
            });
            toast.success('Resource created');
            setNewResource({ title: '', quantity: 10, unit: 'kg', type: 'seed' });
            onClose();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to create resource');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg border-primary shadow-[0_0_50px_rgba(0,255,157,0.2)]">
                <h2 className="mb-6">Publish New Signal</h2>
                <form onSubmit={handleCreate}>
                    <Input
                        label="Title"
                        placeholder="What are you offering?"
                        value={newResource.title}
                        onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                        required
                    />
                    <div className="flex gap-4">
                        <Input
                            label="Quantity"
                            type="number"
                            value={newResource.quantity}
                            onChange={e => setNewResource({ ...newResource, quantity: parseInt(e.target.value) })}
                            required
                        />
                        <Input
                            label="Unit"
                            placeholder="kg, liters, hours..."
                            value={newResource.unit}
                            onChange={e => setNewResource({ ...newResource, unit: e.target.value })}
                            required
                        />
                    </div>
                    <label className="block text-xs uppercase text-text-muted mb-1 font-semibold">Type</label>
                    <select
                        className="bg-[rgba(5,20,18,0.6)] border border-primary-dirty px-4 py-3 rounded-sm text-text-main font-mono outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_15px_rgba(0,255,157,0.1)] focus:bg-[rgba(5,20,18,0.8)] w-full mb-8"
                        value={newResource.type}
                        onChange={e => setNewResource({ ...newResource, type: e.target.value as any })}
                    >
                        <option value="seed">Seed</option>
                        <option value="compost">Compost</option>
                        <option value="harvest">Harvest</option>
                        <option value="labor">Labor</option>
                    </select>

                    <div className="flex justify-end gap-4">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={createResource.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={createResource.isPending}>
                            Publish Signal
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
