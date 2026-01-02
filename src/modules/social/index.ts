import { OpenAPIHono, z } from '@hono/zod-openapi';
import { SocialService } from './service';
import { requireAuth } from '../auth/helper';

const socialApp = new OpenAPIHono();

const friendSchema = z.object({
    id: z.number(),
    username: z.string(),
    bio: z.string().nullable(),
    themeColor: z.string().nullable(),
});

socialApp.openapi(
    {
        method: 'post',
        path: '/request',
        description: 'Send a friend request',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            friendId: z.number(),
                        }),
                    },
                },
            },
        },
        responses: {
            201: { description: 'Friend request sent' },
            400: { description: 'Invalid request' },
            404: { description: 'User not found' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { friendId } = c.req.valid('json');
        const request = await SocialService.sendRequest(userId, friendId);
        return c.json(request, 201);
    }
);

socialApp.openapi(
    {
        method: 'post',
        path: '/accept',
        description: 'Accept a friend request',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            requesterId: z.number(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: { description: 'Friend request accepted' },
            404: { description: 'Request not found' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { requesterId } = c.req.valid('json');
        const request = await SocialService.acceptRequest(userId, requesterId);
        return c.json(request, 200);
    }
);

socialApp.openapi(
    {
        method: 'post',
        path: '/reject',
        description: 'Reject a friend request',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            requesterId: z.number(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: { description: 'Friend request rejected' },
            404: { description: 'Request not found' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { requesterId } = c.req.valid('json');
        const request = await SocialService.rejectRequest(userId, requesterId);
        return c.json(request, 200);
    }
);

socialApp.openapi(
    {
        method: 'get',
        path: '/friends',
        description: 'List current user friends',
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: 'List of friends',
                content: {
                    'application/json': {
                        schema: z.array(friendSchema),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const friends = await SocialService.listFriends(userId);
        return c.json(friends, 200);
    }
);

const requestSchema = z.object({
    id: z.number(),
    username: z.string(),
    bio: z.string().nullable(),
    themeColor: z.string().nullable(),
    requestId: z.number(),
    createdAt: z.any(),
});

socialApp.openapi(
    {
        method: 'get',
        path: '/requests',
        description: 'List pending friend requests',
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: 'List of pending requests',
                content: {
                    'application/json': {
                        schema: z.array(requestSchema),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const pending = await SocialService.listPendingRequests(userId);
        return c.json(pending, 200);
    },
);

socialApp.openapi(
    {
        method: 'get',
        path: '/outbound-requests',
        description: 'List outbound friend requests',
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: 'List of outbound requests',
                content: {
                    'application/json': {
                        schema: z.array(requestSchema),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const outbound = await SocialService.listOutboundRequests(userId);
        return c.json(outbound, 200);
    },
);

socialApp.openapi(
    {
        method: 'delete',
        path: '/friends/{id}',
        description: 'Remove a friend',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: { description: 'Friend removed' },
            404: { description: 'Friendship not found' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const friendId = parseInt(c.req.param('id')!);
        await SocialService.removeFriend(userId, friendId);
        return c.json({ message: 'Friend removed' }, 200);
    },
);

socialApp.openapi(
    {
        method: 'get',
        path: '/friends/{id}/interactions',
        description: 'Get unified interactions with a friend',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: {
                description: 'Timeline of messages and trades',
                content: {
                    'application/json': {
                        schema: z.array(z.object({
                            id: z.number(),
                            interactionType: z.enum(['MESSAGE', 'TRADE']),
                            senderId: z.number().optional().nullable(), // for messages
                            receiverId: z.number(),
                            initiatorId: z.number().optional().nullable(), // for trades
                            content: z.string().optional().nullable(), // for messages
                            status: z.string().optional().nullable(), // for trades
                            isRead: z.boolean().optional().nullable(),
                            createdAt: z.any(),
                        })),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const friendId = parseInt(c.req.param('id')!);
        const interactions = await SocialService.getInteractions(userId, friendId);
        return c.json(interactions, 200);
    },
);

export default socialApp;
