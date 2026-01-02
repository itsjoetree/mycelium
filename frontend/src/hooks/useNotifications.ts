import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data, error } = await (client.GET as any)('/notifications', {});
            if (error) throw error;
            return data as any[];
        },
    });
}

export function useReadNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data, error } = await (client.PATCH as any)('/notifications/{id}/read', {
                params: { path: { id: id.toString() } },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useReadAllNotifications() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data, error } = await (client.POST as any)('/notifications/read-all', {});
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
