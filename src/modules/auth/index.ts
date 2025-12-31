import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '../../db';
import { users } from '../../db/schema';
import { AuthService } from './service';
import { eq } from 'drizzle-orm';
import { setCookie } from 'hono/cookie';

const authApp = new OpenAPIHono();

const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

authApp.openapi(
    {
        method: 'post',
        path: '/register',
        description: 'Register a new user',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: registerSchema,
                    },
                },
            },
        },
        responses: {
            201: { description: 'User created' },
            400: { description: 'Invalid input or user already exists' },
        },
    },
    async (c) => {
        const { username, email, password } = c.req.valid('json');

        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
            return c.json({ error: 'User already exists' }, 400);
        }

        const passwordHash = await AuthService.hashPassword(password);
        const [user] = await db
            .insert(users)
            .values({
                username,
                email,
                passwordHash,
            })
            .returning();

        const sessionId = await AuthService.createSession(user.id);
        setCookie(c, 'session_id', sessionId, {
            httpOnly: true,
            secure: true, // Should be true in prod
            sameSite: 'Strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return c.json({ message: 'Registered successfully', userId: user.id }, 201);
    },
);

authApp.openapi(
    {
        method: 'post',
        path: '/login',
        description: 'Login user',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: loginSchema,
                    },
                },
            },
        },
        responses: {
            200: { description: 'Logged in' },
            401: { description: 'Invalid credentials' },
        },
    },
    async (c) => {
        const { email, password } = c.req.valid('json');

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        const valid = await AuthService.verifyPassword(user.passwordHash, password);
        if (!valid) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        const sessionId = await AuthService.createSession(user.id);
        setCookie(c, 'session_id', sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });

        return c.json({ message: 'Logged in successfully' }, 200);
    },
);

export default authApp;
