import { OpenAPIHono, z } from '@hono/zod-openapi';
import { NotificationService } from './service';
import { requireAuth } from '../auth/helper';

const notificationApp = new OpenAPIHono();

const notificationSchema = z.object({
    id: z.number(),
    userId: z.number(),
    type: z.string(),
    content: z.string(),
    isRead: z.boolean(),
    tradeId: z.number().nullable(),
    resourceId: z.number().nullable(),
    createdAt: z.string(),
});

notificationApp.openapi(
    {
        method: 'get',
        path: '/',
        description: 'List user notifications',
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: 'List of notifications',
                content: {
                    'application/json': {
                        schema: z.array(notificationSchema),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const list = await NotificationService.getNotifications(userId);
        return c.json(list as any, 200);
    },
);

notificationApp.openapi(
    {
        method: 'patch',
        path: '/{id}/read',
        description: 'Mark a notification as read',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: { description: 'Notification updated' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const id = parseInt(c.req.param('id')!);
        const updated = await NotificationService.markAsRead(id, userId);
        return c.json(updated, 200);
    },
);

notificationApp.openapi(
    {
        method: 'post',
        path: '/read-all',
        description: 'Mark all notifications as read',
        security: [{ cookieAuth: [] }],
        responses: {
            200: { description: 'All notifications updated' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        await NotificationService.markAllAsRead(userId);
        return c.json({ success: true }, 200);
    },
);

export default notificationApp;
