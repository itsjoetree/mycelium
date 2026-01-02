import { useMutation, useQuery } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useTradesList() {
    return useQuery({
        queryKey: ['trades'],
        queryFn: async () => {
            const { data, error } = await client.GET('/trades');
            if (error) throw error;
            return data;
        },
    });
}

export function useTradeById(id: number | null) {
    return useQuery({
        queryKey: ['trades', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await client.GET('/trades/{id}', {
                params: { path: { id: id.toString() } },
            });
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}

export function useCreateTrade() {
    return useMutation({
        mutationFn: async (body: { receiverId: number; resourceIds: number[] }) => {
            const { data, error } = await client.POST('/trades', {
                body,
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useAcceptTrade() {
    return useMutation({
        mutationFn: async (tradeId: string | number) => {
            const { data, error } = await client.POST('/trades/{id}/accept', {
                params: { path: { id: tradeId.toString() } },
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useCancelTrade() {
    return useMutation({
        mutationFn: async (tradeId: string | number) => {
            const { data, error } = await client.POST('/trades/{id}/cancel', {
                params: { path: { id: tradeId.toString() } },
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useRejectTrade() {
    return useMutation({
        mutationFn: async (tradeId: string | number) => {
            const { data, error } = await client.POST('/trades/{id}/reject', {
                params: { path: { id: tradeId.toString() } },
            });
            if (error) throw error;
            return data;
        },
    });
}
