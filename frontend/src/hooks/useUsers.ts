import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { useUserSession } from './useAuth';

export function useUserProfile(id: number | string | undefined) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await client.GET('/users/{id}', {
                params: { path: { id: id.toString() } },
            });
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}

export function useMyProfile() {
    const { data: session } = useUserSession();
    return useQuery({
        queryKey: ['profile', 'me'],
        queryFn: async () => {
            const { data, error } = await client.GET('/users/me');
            if (error) throw error;
            return data;
        },
        enabled: !!session,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: { bio?: string; themeColor?: string }) => {
            const { data, error } = await client.PATCH('/users/me', {
                body,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile', 'me'], data);
            queryClient.invalidateQueries({ queryKey: ['user', data.id] });
            queryClient.invalidateQueries({ queryKey: ['session'] });
        },
    });
}

export function useUserSearch(search: string) {
    return useQuery({
        queryKey: ['users', 'search', search],
        queryFn: async () => {
            const { data, error } = await client.GET('/users/search', {
                params: { query: { search } },
            });
            if (error) throw error;
            return data;
        },
        enabled: search.length >= 2,
        placeholderData: (previousData) => previousData,
    });
}
