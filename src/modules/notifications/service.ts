import { db } from '../../db';
import { notifications } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { WebSocketManager } from '../../lib/ws';

export class NotificationService {
    static async createNotification(data: {
        userId: number;
        type: string;
        content: string;
        tradeId?: number;
        resourceId?: number;
    }) {
        const [notification] = await db
            .insert(notifications)
            .values({
                userId: data.userId,
                type: data.type,
                content: data.content,
                tradeId: data.tradeId,
                resourceId: data.resourceId,
            })
            .returning();

        // Push real-time update via WebSocket
        WebSocketManager.send(data.userId, {
            type: 'NOTIFICATION_RECEIVED',
            payload: notification,
        });

        return notification;
    }

    static async getNotifications(userId: number) {
        return await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(50);
    }

    static async markAsRead(notificationId: number, userId: number) {
        const [notification] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId)
                )
            )
            .returning();

        return notification;
    }

    static async markAllAsRead(userId: number) {
        return await db
            .update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.userId, userId))
            .returning();
    }
}
