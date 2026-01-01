import { useMutation, useQuery } from '@tanstack/react-query';

// ... existing code ...

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
import { client } from '../lib/api';

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


