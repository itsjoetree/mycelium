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
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: { email: string; password: string }) => {
            const { data, error } = await client.POST('/auth/login', {
                body,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['session'] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
}

export function useUserSession() {
    return useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const res = await client.GET('/auth/me');
            if (res.error) {
                const errorObj = res as any;
                if (errorObj.response?.status === 401) return null;
                throw errorObj.error;
            }
            return res.data;
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
