import { OpenAPIHono, z } from '@hono/zod-openapi';
import { db } from '../../db';
import { resources } from '../../db/schema';
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

resourceApp.openapi(
    {
        method: 'get',
        path: '/',
        description: 'List resources',
        responses: {
            200: { description: 'List of resources' },
        },
    },
    async (c) => {
        const allResources = await db.select().from(resources).orderBy(desc(resources.createdAt)).limit(50);
        return c.json(allResources, 200);
    },
);

export default resourceApp;
