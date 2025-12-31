import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { AuthService } from './service';
import { HTTPException } from 'hono/http-exception';

export async function requireAuth(c: Context) {
    const sessionId = getCookie(c, 'session_id');
    if (!sessionId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const session = await AuthService.validateSession(sessionId);
    if (!session) {
        throw new HTTPException(401, { message: 'Invalid session' });
    }

    return session.userId;
}
