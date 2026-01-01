import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';

export function useRegister() {
    return useMutation({
        mutationFn: async (body: { username: string; email: string; password: string }) => {
            const { data, error } = await client.POST('/auth/register', {
                body,
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useLogin() {
    return useMutation({
        mutationFn: async (body: { email: string; password: string }) => {
            const { data, error } = await client.POST('/auth/login', {
                body,
            });
            if (error) throw error;
            return data;
        },
    });
}

export function useUserSession() {
    return useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const { data, error } = await client.GET('/auth/me');
            if (error) throw error;
            return data;
        },
        retry: false,
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data, error } = await client.POST('/auth/logout');
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.setQueryData(['session'], null);
            queryClient.removeQueries();
        },
    });
}
