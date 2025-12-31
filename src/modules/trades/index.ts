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

export default tradeApp;
