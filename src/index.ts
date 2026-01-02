import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { logger } from 'hono/logger';
import { errorHandler, notFoundHandler } from './lib/middleware';

import authApp from './modules/auth';
import resourceApp from './modules/resources';
import tradeApp from './modules/trades';
import notificationApp from './modules/notifications';

import { rateLimiter } from './lib/rate-limit';

const app = new OpenAPIHono();

app.use('*', logger());
app.use('*', rateLimiter({ windowMs: 60 * 1000, maxRequests: 100 })); // 100 reqs per minute
app.onError(errorHandler);
app.notFound(notFoundHandler);

app.route('/auth', authApp);
app.route('/resources', resourceApp);
app.route('/trades', tradeApp);
app.route('/notifications', notificationApp);

app.get('/', (c) => {
    return c.json({
        message: 'Welcome to the Mycelium API',
        status: 'healthy',
    });
});

// Docs
app.doc('/doc', {
    openapi: '3.0.0',
    info: {
        version: '1.0.0',
        title: 'Mycelium API',
        description: 'Decentralized resource exchange for urban farming',
    },
});

app.get(
    '/reference',
    apiReference({
        theme: 'saturn',
        spec: {
            url: '/doc',
        },
    } as any),
);

import { createBunWebSocket } from 'hono/bun';
import { WebSocketManager } from './lib/ws';
import { AuthService } from './modules/auth/service';
import type { ServerWebSocket } from 'bun';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket<any>>();

app.get(
    '/ws',
    upgradeWebSocket(async (c) => {
        // Basic auth logic for WS - simplified
        // In production we'd parse the cookie manually or use a ticket system
        // For now, assuming client sends ?userId=X for demo purposes or we try to parse cookie
        // Let's try to parse cookie manually from header
        const cookieHeader = c.req.header('Cookie');
        let userId = 0;

        if (cookieHeader) {
            const match = cookieHeader.match(/session_id=([^;]+)/);
            if (match) {
                const sid = match[1];
                const session = await AuthService.validateSession(sid);
                if (session) userId = session.userId;
            }
        }

        if (!userId) {
            // Fallback or fail. For demo simplified.
            // return { error: 'Unauthorized' };
        }

        return {
            onOpen(event, ws) {
                if (userId) {
                    WebSocketManager.addConnection(userId, ws as any);
                    console.log(`User ${userId} connected`);
                }
            },
            onClose(event, ws) {
                if (userId) {
                    WebSocketManager.removeConnection(userId, ws as any);
                    console.log(`User ${userId} disconnected`);
                }
            },
            onMessage(event, ws) {
                console.log(`Message from ${userId}: ${event.data}`);
            },
        };
    })
);


const port = parseInt(process.env.PORT || '3000');
console.log(`Server is running on port ${port}`);

export default {
    port,
    fetch: app.fetch,
    websocket,
};

