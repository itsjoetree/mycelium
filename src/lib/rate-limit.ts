import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

// In-memory store: IP -> Timestamp[]
const ipHits = new Map<string, number[]>();

// Cleanup interval (simple garbage collection)
const cleanupParams = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipHits.entries()) {
        // Keep only timestamps within the longest possible window (e.g., 1 min)
        const valid = timestamps.filter(t => now - t < 60000);
        if (valid.length === 0) {
            ipHits.delete(ip);
        } else {
            ipHits.set(ip, valid);
        }
    }
}, 60000); // Run every minute

// Allow process to exit even if this interval is running (crucial for tests)
if (cleanupParams.unref) cleanupParams.unref();

export const rateLimiter = (config: RateLimitConfig) => createMiddleware(async (c, next) => {
    // Identify client by IP (or X-Forwarded-For)
    // In Bun/Hono local, c.req.header('x-forwarded-for') might be empty, fallback to a mock IP for local dev if needed
    // But Bun's request object usually doesn't expose raw socket IP easily in Hono unless we use a specific helper or trust proxy
    const ip = c.req.header('x-forwarded-for') || '127.0.0.1';

    const now = Date.now();
    const windowStart = now - config.windowMs;

    let timestamps = ipHits.get(ip) || [];

    // Filter out old requests
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= config.maxRequests) {
        c.header('Retry-After', Math.ceil(config.windowMs / 1000).toString());
        throw new HTTPException(429, { message: 'Too Many Requests' });
    }

    // Record this request
    timestamps.push(now);
    ipHits.set(ip, timestamps);

    await next();
});
