import { db } from '../../db';
import { messages, users } from '../../db/schema';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { WebSocketManager } from '../../lib/ws';

export class MessageService {
    static async sendMessage(senderId: number, receiverId: number, content: string) {
        const [message] = await db
            .insert(messages)
            .values({
                senderId,
                receiverId,
                content,
            })
            .returning();

        // Real-time update via WebSocket
        WebSocketManager.send(receiverId, {
            type: 'MESSAGE_RECEIVED',
            payload: message,
        });

        return message;
    }

    static async getMessagesBetweenUsers(user1Id: number, user2Id: number) {
        return await db
            .select()
            .from(messages)
            .where(
                or(
                    and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
                    and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
                )
            )
            .orderBy(asc(messages.createdAt));
    }

    static async markAsRead(receiverId: number, senderId: number) {
        return await db
            .update(messages)
            .set({ isRead: true })
            .where(
                and(
                    eq(messages.receiverId, receiverId),
                    eq(messages.senderId, senderId),
                    eq(messages.isRead, false)
                )
            )
            .returning();
    }
}
