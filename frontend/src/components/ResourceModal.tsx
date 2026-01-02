import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateResource, useUpdateResource } from '../hooks/useResources';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'sonner';

interface ResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        id: number;
        title: string;
        type: "seed" | "compost" | "harvest" | "labor";
        quantity: number;
        unit: string;
        latitude?: number | string;
        longitude?: number | string;
    } | null;
}

export const ResourceModal: React.FC<ResourceModalProps> = ({ isOpen, onClose, initialData }) => {
    const { t } = useTranslation();
    const createResource = useCreateResource();
    const updateResource = useUpdateResource();
    const [newResource, setNewResource] = useState<{
        title: string;
        quantity: number;
        unit: string;
        type: "seed" | "compost" | "harvest" | "labor";
        latitude: number;
        longitude: number;
    }>({
        title: '',
        quantity: 10,
        unit: 'kg',
        type: 'seed',
        latitude: 0,
        longitude: 0
    });

    useEffect(() => {
        if (initialData) {
            setNewResource({
                title: initialData.title,
                quantity: initialData.quantity,
                unit: initialData.unit,
                type: initialData.type,
                latitude: Number(initialData.latitude) || 0,
                longitude: Number(initialData.longitude) || 0
            });
        } else {
            setNewResource({ title: '', quantity: 10, unit: 'kg', type: 'seed', latitude: 0, longitude: 0 });
        }
    }, [initialData, isOpen]);

    const [isLocating, setIsLocating] = useState(false);

    const getMyLocation = () => {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setNewResource(prev => ({
                    ...prev,
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6))
                }));
                setIsLocating(false);
                toast.success(t('resource.toasts.loc_updated'));
            },
            (err) => {
                console.error(err);
                setIsLocating(false);
                toast.error(t('resource.toasts.loc_fail'));
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) {
                await updateResource.mutateAsync({ id: initialData.id, body: newResource });
                toast.success(t('resource.toasts.updated'));
            } else {
                await createResource.mutateAsync(newResource);
                toast.success(t('resource.toasts.created'));
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.message || t('resource.toasts.failed'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <Card className="w-full max-w-lg border-primary shadow-[0_0_50px_var(--accent-glow)]">
                <h2 className="mb-6">{initialData ? t('resource.modal.edit_title') : t('resource.modal.create_title')}</h2>
                <form onSubmit={handleSubmit}>
                    <Input
                        label={t('resource.modal.title_label')}
                        placeholder={t('resource.modal.title_placeholder')}
                        value={newResource.title}
                        onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                        required
                    />
                    <div className="flex gap-4">
                        <Input
                            label={t('resource.modal.quantity_label')}
                            type="number"
                            value={newResource.quantity}
                            onChange={e => setNewResource({ ...newResource, quantity: parseInt(e.target.value) })}
                            required
                        />
                        <Input
                            label={t('resource.modal.unit_label')}
                            placeholder={t('resource.modal.unit_placeholder')}
                            value={newResource.unit}
                            onChange={e => setNewResource({ ...newResource, unit: e.target.value })}
                            required
                        />
                    </div>
                    <label className="block text-xs uppercase text-text-muted mb-1 font-semibold">{t('resource.modal.type_label')}</label>
                    <select
                        className="bg-[rgba(5,20,18,0.6)] border border-primary-dirty px-4 py-3 rounded-sm text-text-main font-mono outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_15px_var(--accent-glow)] focus:bg-[rgba(5,20,18,0.8)] w-full mb-8"
                        value={newResource.type}
                        onChange={e => setNewResource({ ...newResource, type: e.target.value as any })}
                    >
                        <option value="seed">{t('dashboard.filters.seed')}</option>
                        <option value="compost">{t('dashboard.filters.compost')}</option>
                        <option value="harvest">{t('dashboard.filters.harvest')}</option>
                        <option value="labor">{t('dashboard.filters.labor')}</option>
                    </select>

                    <div className="mb-6 p-4 bg-black/40 border border-glass-surface rounded-sm">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs uppercase text-text-muted font-semibold">{t('resource.modal.geo_label')}</label>
                            <button
                                type="button"
                                onClick={getMyLocation}
                                className="text-[0.6rem] text-primary uppercase font-bold hover:underline flex items-center gap-1"
                                disabled={isLocating}
                            >
                                {isLocating ? <span className="loader scale-50"></span> : <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>}
                                {t('resource.modal.use_location')}
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-[0.5rem] uppercase text-text-muted mb-1 font-mono">{t('resource.modal.latitude')}</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    className="bg-transparent border-b border-glass-surface text-text-main font-mono text-xs outline-none focus:border-primary w-full pb-1"
                                    value={newResource.latitude}
                                    onChange={e => setNewResource({ ...newResource, latitude: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[0.5rem] uppercase text-text-muted mb-1 font-mono">{t('resource.modal.longitude')}</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    className="bg-transparent border-b border-glass-surface text-text-main font-mono text-xs outline-none focus:border-primary w-full pb-1"
                                    value={newResource.longitude}
                                    onChange={e => setNewResource({ ...newResource, longitude: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={createResource.isPending || updateResource.isPending}>
                            {t('resource.modal.cancel')}
                        </Button>
                        <Button type="submit" isLoading={createResource.isPending || updateResource.isPending}>
                            {initialData ? t('resource.modal.save') : t('resource.modal.publish')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
