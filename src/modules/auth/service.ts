import { db } from '../../db';
import { users, sessions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export class AuthService {
    static async hashPassword(password: string): Promise<string> {
        return argon2.hash(password);
    }

    static async verifyPassword(hash: string, plain: string): Promise<boolean> {
        return argon2.verify(hash, plain);
    }

    static async createSession(userId: number) {
        const sessionId = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + SESSION_DURATION);

        await db.insert(sessions).values({
            id: sessionId,
            userId,
            expiresAt,
        });

        return sessionId;
    }

    static async validateSession(sessionId: string) {
        const [session] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId));

        if (!session || session.expiresAt < new Date()) {
            return null;
        }

        return session;
    }

    static async deleteSession(sessionId: string) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
}
