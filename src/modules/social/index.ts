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
                        schema: z.array(z.object({
                            id: z.number(),
                            username: z.string(),
                            bio: z.string().nullable(),
                            themeColor: z.string().nullable(),
                            requestId: z.number(),
                            createdAt: z.any(),
                        })),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const requests = await SocialService.listPendingRequests(userId);
        return c.json(requests, 200);
    }
);

export default socialApp;
