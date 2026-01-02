import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export class UserService {
    static async getProfile(userId: number) {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                id: true,
                username: true,
                bio: true,
                themeColor: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new HTTPException(404, { message: 'User not found' });
        }

        return user;
    }

    static async updateProfile(userId: number, data: { bio?: string; themeColor?: string }) {
        const [updated] = await db
            .update(users)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                username: users.username,
                bio: users.bio,
                themeColor: users.themeColor,
            });

        if (!updated) {
            throw new HTTPException(404, { message: 'User not found' });
        }

        return updated;
    }
}
