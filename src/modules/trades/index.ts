import { OpenAPIHono, z } from '@hono/zod-openapi';
import { TradeService } from './service';
import { requireAuth } from '../auth/helper';

const tradeApp = new OpenAPIHono();

const createTradeSchema = z.object({
    receiverId: z.number(),
    resourceIds: z.array(z.number()),
});

tradeApp.openapi(
    {
        method: 'post',
        path: '/',
        description: 'Propose a new trade',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: createTradeSchema,
                    },
                },
            },
        },
        responses: {
            201: { description: 'Trade created' },
            400: { description: 'Invalid resources' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { receiverId, resourceIds } = c.req.valid('json');

        const trade = await TradeService.createTrade(userId, receiverId, resourceIds);
        return c.json(trade, 201);
    },
);

tradeApp.openapi(
    {
        method: 'get',
        path: '/',
        description: 'List user trades',
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: 'List of trades',
                content: {
                    'application/json': {
                        schema: z.array(z.object({
                            id: z.number(),
                            initiatorId: z.number(),
                            receiverId: z.number(),
                            initiatorUsername: z.string().nullable(),
                            receiverUsername: z.string().nullable(),
                            resources: z.array(z.object({
                                title: z.string(),
                                quantity: z.number(),
                                unit: z.string(),
                            })),
                            status: z.string(),
                            createdAt: z.any(),
                        })),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const list = await TradeService.getTrades(userId);
        return c.json(list, 200);
    },
);

tradeApp.openapi(
    {
        method: 'post',
        path: '/{id}/accept',
        description: 'Accept a trade',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: { description: 'Trade accepted' },
            409: { description: 'Conflict - Resources unavailable' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const id = parseInt(c.req.param('id')!);

        const trade = await TradeService.acceptTrade(id, userId);
        return c.json(trade, 200);
    },
);

tradeApp.openapi(
    {
        method: 'post',
        path: '/{id}/cancel',
        description: 'Cancel a pending trade',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: { description: 'Trade cancelled' },
            403: { description: 'Forbidden' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const id = parseInt(c.req.param('id')!);
        const trade = await TradeService.cancelTrade(id, userId);
        return c.json(trade, 200);
    },
);

tradeApp.openapi(
    {
        method: 'post',
        path: '/{id}/reject',
        description: 'Reject a pending trade',
        security: [{ cookieAuth: [] }],
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: { description: 'Trade rejected' },
            403: { description: 'Forbidden' },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const id = parseInt(c.req.param('id')!);
        const trade = await TradeService.rejectTrade(id, userId);
        return c.json(trade, 200);
    },
);

export default tradeApp;
