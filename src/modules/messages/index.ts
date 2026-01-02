import { OpenAPIHono, z } from '@hono/zod-openapi';
import { MessageService } from './service';
import { requireAuth } from '../auth/helper';

const messageApp = new OpenAPIHono();

const messageSchema = z.object({
    id: z.number(),
    senderId: z.number(),
    receiverId: z.number(),
    content: z.string(),
    isRead: z.boolean().nullable(),
    createdAt: z.any().nullable(),
});

messageApp.openapi(
    {
        method: 'get',
        path: '/{friendId}',
        summary: 'Get messages with a friend',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                friendId: z.string(),
            }),
        },
        responses: {
            200: {
                description: 'List of messages',
                content: {
                    'application/json': {
                        schema: z.array(messageSchema),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const friendId = parseInt(c.req.param('friendId'));
        const messages = await MessageService.getMessagesBetweenUsers(userId, friendId);
        return c.json(messages, 200);
    }
);

messageApp.openapi(
    {
        method: 'post',
        path: '/',
        summary: 'Send a message',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            receiverId: z.number(),
                            content: z.string(),
                        }),
                    },
                },
            },
        },
        responses: {
            201: {
                description: 'Message sent',
                content: {
                    'application/json': {
                        schema: messageSchema,
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { receiverId, content } = c.req.valid('json');
        const message = await MessageService.sendMessage(userId, receiverId, content);
        return c.json(message, 201);
    }
);

messageApp.openapi(
    {
        method: 'post',
        path: '/read/{friendId}',
        summary: 'Mark messages as read',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({
                friendId: z.string(),
            }),
        },
        responses: {
            200: { description: 'Messages marked as read' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const friendId = parseInt(c.req.param('friendId'));
        await MessageService.markAsRead(userId, friendId);
        return c.json({ success: true }, 200);
    }
);

export default messageApp;
