import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useResources(filters?: { type?: any; search?: string; ownerId?: string }) {
    return useQuery({
        queryKey: ['resources', filters],
        queryFn: async () => {
            const { data, error } = await client.GET('/resources', {
                params: {
                    // @ts-ignore
                    query: filters
                }
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useCreateResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: { title: string; type: "seed" | "compost" | "harvest" | "labor"; quantity: number; unit: string; latitude: number; longitude: number }) => {
            // @ts-ignore - Schema strictness might complain about enum or numbers if not precise
            const { data, error } = await client.POST('/resources', {
                body,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}

export function useUpdateResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, body }: { id: number; body: Partial<{ title: string; type: "seed" | "compost" | "harvest" | "labor"; quantity: number; unit: string; latitude: number; longitude: number }> }) => {
            // @ts-ignore
            const { data, error } = await client.PATCH('/resources/{id}' as any, {
                params: { path: { id: id.toString() } },
                body,
            });
            if (error) throw (error as any);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}

export function useDeleteResource() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            // @ts-ignore
            const { data, error } = await client.DELETE('/resources/{id}' as any, {
                params: { path: { id: id.toString() } },
            });
            if (error) throw (error as any);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}
