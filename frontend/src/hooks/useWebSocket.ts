import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useWebSocket() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Construct WS URL - handle secure/unsecure based on window.location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Connected to Mycelium Network');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Message:', data);

                if (data.type === 'TRADE_PROPOSED') {
                    toast.info('New trade proposal received!');
                    queryClient.invalidateQueries({ queryKey: ['trades'] });
                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                }

                if (data.type === 'TRADE_ACCEPTED') {
                    toast.success('A trade has been accepted!');
                    queryClient.invalidateQueries({ queryKey: ['trades'] });
                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                }

                if (data.type === 'TRADE_REJECTED') {
                    toast.info('A trade request was declined');
                    queryClient.invalidateQueries({ queryKey: ['trades'] });
                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                }

                if (data.type === 'TRADE_CANCELLED') {
                    toast.info('A trade proposal was cancelled');
                    queryClient.invalidateQueries({ queryKey: ['trades'] });
                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                }

                if (data.type === 'TRADE_EXPIRED') {
                    toast.error('A trade proposal has expired');
                    queryClient.invalidateQueries({ queryKey: ['trades'] });
                    queryClient.invalidateQueries({ queryKey: ['resources'] });
                }
            } catch (err) {
                console.error('Failed to parse WS message', err);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from Mycelium Network');
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        return () => {
            socket.close();
        };
    }, [queryClient]);
}
