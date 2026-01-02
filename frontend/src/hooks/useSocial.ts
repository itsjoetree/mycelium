import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/api';
import { toast } from 'sonner';

export function useFriends() {
    return useQuery({
        queryKey: ['friends'],
        queryFn: async () => {
            const { data, error } = await client.GET('/social-api/friends');
            if (error) throw error;
            return data;
        },
    });
}

export function usePendingRequests() {
    return useQuery({
        queryKey: ['friend-requests', 'inbound'],
        queryFn: async () => {
            const { data, error } = await client.GET('/social-api/requests', {});
            if (error) throw error;
            return data;
        },
    });
}

export function useOutboundRequests() {
    return useQuery({
        queryKey: ['friend-requests', 'outbound'],
        queryFn: async () => {
            const { data, error } = await client.GET('/social-api/outbound-requests', {});
            if (error) throw error;
            return data;
        },
    });
}

export function useInteractions(friendId: number | null) {
    return useQuery({
        queryKey: ['interactions', friendId],
        queryFn: async () => {
            if (!friendId) return [];
            const { data, error } = await client.GET('/social-api/friends/{id}/interactions', {
                params: { path: { id: friendId.toString() } }
            });
            if (error) throw error;
            return data;
        },
        enabled: !!friendId,
        refetchInterval: 5000, // Poll for new messages every 5s for now
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
            const { data, error } = await client.POST('/messages', {
                body: { receiverId, content }
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['interactions', variables.receiverId] });
        },
    });
}

export function useSendFriendRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (friendId: number) => {
            const { data, error } = await client.POST('/social-api/request', {
                body: { friendId },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
        },
    });
}

export function useAcceptFriendRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (requesterId: number) => {
            const { data, error } = await client.POST('/social-api/accept', {
                body: { requesterId },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useRejectFriendRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (requesterId: number) => {
            const { data, error } = await client.POST('/social-api/reject', {
                body: { requesterId },
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useRemoveFriend() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (friendId: number) => {
            const { error } = await client.DELETE('/social-api/friends/{id}', {
                params: { path: { id: friendId.toString() } },
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['friends'] });
            toast.success('Node disconnected from social sector');
        },
    });
}
