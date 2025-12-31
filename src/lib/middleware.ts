import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export const errorHandler = (err: Error, c: any) => {
    console.error(err);
    if (err instanceof HTTPException) {
        return c.json({ error: err.message }, err.status);
    }
    return c.json({ error: 'Internal Server Error' }, 500);
};

export const notFoundHandler = (c: any) => {
    return c.json({ error: 'Not Found', message: `Route ${c.req.path} not found` }, 404);
};
