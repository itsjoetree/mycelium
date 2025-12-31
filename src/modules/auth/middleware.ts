import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { AuthService } from './service';

export const authMiddleware = createMiddleware(async (c, next) => {
    const sessionId = getCookie(c, 'session_id');

    if (!sessionId) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const session = await AuthService.validateSession(sessionId);
    if (!session) {
        return c.json({ error: 'Invalid session' }, 401);
    }

    c.set('userId', session.userId);
    await next();
});
