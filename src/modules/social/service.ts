import { db } from '../../db';
import { users, friendships } from '../../db/schema';
import { eq, and, or, ne } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { NotificationService } from '../notifications/service';
import { WebSocketManager } from '../../lib/ws';

export class SocialService {
    static async sendRequest(userId: number, friendId: number) {
        if (userId === friendId) {
            throw new HTTPException(400, { message: 'You cannot be friends with yourself' });
        }

        // Check if user exists
        const friend = await db.query.users.findFirst({ where: eq(users.id, friendId) });
        if (!friend) {
            throw new HTTPException(404, { message: 'User not found' });
        }

        // Check for existing friendship/request in either direction
        const existing = await db.query.friendships.findFirst({
            where: or(
                and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
                and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
            ),
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') {
                throw new HTTPException(400, { message: 'You are already friends' });
            }
            if (existing.status === 'PENDING') {
                throw new HTTPException(400, { message: 'A friend request is already pending' });
            }
            // If REJECTED, we could allow sending again or wait. For now, let's allow "re-proposing"
            await db.delete(friendships).where(eq(friendships.id, existing.id));
        }

        const [request] = await db
            .insert(friendships)
            .values({
                userId,
                friendId,
                status: 'PENDING',
            })
            .returning();

        // Notify friend
        const sender = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { username: true }
        });

        await NotificationService.createNotification({
            userId: friendId,
            type: 'FRIEND_REQUEST_RECEIVED',
            content: `@${sender?.username || 'Someone'} sent you a friend request!`,
        });

        return request;
    }

    static async acceptRequest(userId: number, requesterId: number) {
        const [request] = await db
            .update(friendships)
            .set({ status: 'ACCEPTED', updatedAt: new Date() })
            .where(
                and(
                    eq(friendships.userId, requesterId),
                    eq(friendships.friendId, userId),
                    eq(friendships.status, 'PENDING')
                )
            )
            .returning();

        if (!request) {
            throw new HTTPException(404, { message: 'Friend request not found or not pending' });
        }

        // Notify requester
        const accepter = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { username: true }
        });

        await NotificationService.createNotification({
            userId: requesterId,
            type: 'FRIEND_REQUEST_ACCEPTED',
            content: `@${accepter?.username || 'Someone'} accepted your friend request!`,
        });

        return request;
    }

    static async rejectRequest(userId: number, requesterId: number) {
        const [request] = await db
            .update(friendships)
            .set({ status: 'REJECTED', updatedAt: new Date() })
            .where(
                and(
                    eq(friendships.userId, requesterId),
                    eq(friendships.friendId, userId),
                    eq(friendships.status, 'PENDING')
                )
            )
            .returning();

        if (!request) {
            throw new HTTPException(404, { message: 'Friend request not found or not pending' });
        }

        return request;
    }

    static async listFriends(userId: number) {
        // Find all accepted friendships where user is either participant
        const friendsList = await db
            .select({
                id: users.id,
                username: users.username,
                bio: users.bio,
                themeColor: users.themeColor,
            })
            .from(friendships)
            .innerJoin(users, or(
                and(eq(friendships.userId, userId), eq(friendships.friendId, users.id)),
                and(eq(friendships.friendId, userId), eq(friendships.userId, users.id))
            ))
            .where(eq(friendships.status, 'ACCEPTED'));

        return friendsList;
    }

    static async listPendingRequests(userId: number) {
        const pending = await db
            .select({
                id: users.id,
                username: users.username,
                bio: users.bio,
                themeColor: users.themeColor,
                requestId: friendships.id,
                createdAt: friendships.createdAt,
            })
            .from(friendships)
            .innerJoin(users, eq(friendships.userId, users.id))
            .where(
                and(
                    eq(friendships.friendId, userId),
                    eq(friendships.status, 'PENDING')
                )
            );

        return pending;
    }
}
