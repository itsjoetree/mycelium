import { OpenAPIHono, z } from '@hono/zod-openapi';
import { db } from '../../db';
import { resources, users } from '../../db/schema';
import { requireAuth } from '../auth/helper';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

const resourceApp = new OpenAPIHono();

const createResourceSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    type: z.enum(['seed', 'compost', 'harvest', 'labor']),
    quantity: z.number().positive(),
    unit: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

resourceApp.openapi(
    {
        method: 'post',
        path: '/',
        description: 'Create a new resource',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createResourceSchema,
                    },
                },
            },
        },
        responses: {
            201: { description: 'Resource created' },
            401: { description: 'Unauthorized' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { title, description, type, quantity, unit, latitude, longitude } = c.req.valid('json');

        const [resource] = await db
            .insert(resources)
            .values({
                ownerId: userId,
                title,
                description,
                type,
                quantity,
                unit,
                latitude: latitude?.toString(),
                longitude: longitude?.toString(),
            })
            .returning();

        return c.json(resource, 201);
    },
);

const resourceSchema = z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().optional(),
    type: z.enum(['seed', 'compost', 'harvest', 'labor']),
    quantity: z.number(),
    unit: z.string(),
    ownerId: z.number(),
    ownerUsername: z.string().nullable(),
    status: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    createdAt: z.string(),
});

resourceApp.openapi(
    {
        method: 'get',
        path: '/',
        description: 'List resources',
        responses: {
            200: {
                description: 'List of resources',
                content: {
                    'application/json': {
                        schema: z.array(resourceSchema),
                    },
                },
            },
        },
    },
    async (c) => {
        const list = await db
            .select({
                id: resources.id,
                title: resources.title,
                description: resources.description,
                type: resources.type,
                quantity: resources.quantity,
                unit: resources.unit,
                ownerId: resources.ownerId,
                status: resources.status,
                latitude: resources.latitude,
                longitude: resources.longitude,
                createdAt: resources.createdAt,
                ownerUsername: users.username,
            })
            .from(resources)
            .leftJoin(users, eq(resources.ownerId, users.id));

        return c.json(list as any, 200);
    },
);

export default resourceApp;
