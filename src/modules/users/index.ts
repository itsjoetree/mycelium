import { OpenAPIHono, z } from '@hono/zod-openapi';
import { UserService } from './service';
import { requireAuth } from '../auth/helper';

const userApp = new OpenAPIHono();

const userProfileSchema = z.object({
    id: z.number(),
    username: z.string(),
    bio: z.string().nullable(),
    themeColor: z.string().nullable(),
    createdAt: z.any(),
});

userApp.openapi(
    {
        method: 'get',
        path: '/me',
        description: 'Get current user profile',
        security: [{ cookieAuth: [] }],
        responses: {
            200: {
                description: 'User profile',
                content: {
                    'application/json': {
                        schema: userProfileSchema,
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const profile = await UserService.getProfile(userId);
        return c.json(profile, 200);
    }
);

userApp.openapi(
    {
        method: 'patch',
        path: '/me',
        description: 'Update current user profile',
        security: [{ cookieAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            bio: z.string().optional(),
                            themeColor: z.string().optional(),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Profile updated',
                content: {
                    'application/json': {
                        schema: z.object({
                            id: z.number(),
                            username: z.string(),
                            bio: z.string().nullable(),
                            themeColor: z.string().nullable(),
                        }),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const data = c.req.valid('json');
        const updated = await UserService.updateProfile(userId, data);
        return c.json(updated, 200);
    }
);

userApp.openapi(
    {
        method: 'get',
        path: '/search',
        description: 'Search for users',
        security: [{ cookieAuth: [] }],
        request: {
            query: z.object({
                search: z.string().optional(),
            }),
        },
        responses: {
            200: {
                description: 'User list',
                content: {
                    'application/json': {
                        schema: z.array(z.object({
                            id: z.number(),
                            username: z.string(),
                            bio: z.string().nullable(),
                            themeColor: z.string().nullable(),
                        })),
                    },
                },
            },
        },
    },
    async (c) => {
        const userId = await requireAuth(c);
        const { search } = c.req.valid('query');
        const users = await UserService.searchUsers(search || '', userId);
        return c.json(users, 200);
    }
);

userApp.openapi(
    {
        method: 'get',
        path: '/{id}',
        description: 'Get user profile by ID',
        request: {
            params: z.object({ id: z.string() }),
        },
        responses: {
            200: {
                description: 'User profile',
                content: {
                    'application/json': {
                        schema: userProfileSchema,
                    },
                },
            },
            404: { description: 'User not found' },
        },
    },
    async (c) => {
        const id = parseInt(c.req.param('id')!);
        const profile = await UserService.getProfile(id);
        return c.json(profile, 200);
    }
);

export default userApp;
