import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { AuthService } from './service';
import { HTTPException } from 'hono/http-exception';

export async function requireAuth(c: Context) {
    let sessionId = getCookie(c, 'session_id');

    // Fallback: Manually parse if getCookie misses it (sometimes happens in specific proxy/POST scenarios)
    if (!sessionId) {
        const cookieHeader = c.req.header('Cookie');
        sessionId = cookieHeader?.match(/session_id=([^;]+)/)?.[1];
    }

    if (!sessionId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const session = await AuthService.validateSession(sessionId);
    if (!session) {
        throw new HTTPException(401, { message: 'Invalid session' });
    }

    return session.userId;
}
