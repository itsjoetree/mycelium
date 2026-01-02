import { OpenAPIHono, z } from '@hono/zod-openapi';
import { db } from '../../db';
import { resources, users } from '../../db/schema';
import { requireAuth } from '../auth/helper';
import { TradeService } from '../trades/service';
import { eq, desc, and, gte, lte, or, ilike } from 'drizzle-orm';

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

const updateResourceSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    type: z.enum(['seed', 'compost', 'harvest', 'labor']).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

resourceApp.openapi(
    {
        method: 'patch',
        path: '/{id}',
        description: 'Update a resource',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
            body: {
                content: {
                    'application/json': {
                        schema: updateResourceSchema,
                    },
                },
            },
        },
        responses: {
            200: { description: 'Resource updated' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Resource not found' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const pid = c.req.param('id');
        const resourceId = parseInt(pid!);
        const updates = c.req.valid('json');

        const [existing] = await db.select().from(resources).where(eq(resources.id, resourceId));
        if (!existing) return c.json({ error: 'Resource not found' }, 404);
        if (existing.ownerId !== userId) return c.json({ error: 'Forbidden' }, 403);

        const [updated] = await db
            .update(resources)
            .set({
                ...updates,
                latitude: updates.latitude?.toString(),
                longitude: updates.longitude?.toString(),
            })
            .where(eq(resources.id, resourceId))
            .returning();

        return c.json(updated, 200);
    },
);

resourceApp.openapi(
    {
        method: 'delete',
        path: '/{id}',
        description: 'Delete a resource',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: { description: 'Resource deleted' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Resource not found' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const resourceId = parseInt(c.req.param('id')!);

        const [existing] = await db.select().from(resources).where(eq(resources.id, resourceId));
        if (!existing) return c.json({ error: 'Resource not found' }, 404);
        if (existing.ownerId !== userId) return c.json({ error: 'Forbidden' }, 403);

        // Invalidate any pending trades involving this resource first
        await TradeService.invalidateTradesByResourceId(resourceId);

        await db.delete(resources).where(eq(resources.id, resourceId));

        return c.json({ success: true }, 200);
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

const resourceQuerySchema = z.object({
    type: z.enum(['seed', 'compost', 'harvest', 'labor']).optional(),
    search: z.string().optional(),
    ownerId: z.string().optional(),
    minQuantity: z.string().optional(),
});

resourceApp.openapi(
    {
        method: 'get',
        path: '/',
        description: 'List resources',
        request: {
            query: resourceQuerySchema,
        },
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
        const { type, search, ownerId, minQuantity } = c.req.valid('query');

        const filters = [];
        if (type) filters.push(eq(resources.type, type));
        if (ownerId) filters.push(eq(resources.ownerId, parseInt(ownerId)));
        if (minQuantity) filters.push(gte(resources.quantity, parseFloat(minQuantity)));

        if (search) {
            const searchPattern = `%${search}%`;
            filters.push(
                or(
                    ilike(resources.title, searchPattern),
                    ilike(resources.description, searchPattern)
                )
            );
        }

        const query = db
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
            .leftJoin(users, eq(resources.ownerId, users.id))
            .where(filters.length > 0 ? and(...filters) : undefined)
            .orderBy(desc(resources.createdAt));

        const list = await query;

        return c.json(list as any, 200);
    },
);

export default resourceApp;
