import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useResources() {
    return useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const { data, error } = await client.GET('/resources');
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
