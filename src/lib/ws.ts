import type { ServerWebSocket } from 'bun';

export class WebSocketManager {
    private static connections = new Map<number, ServerWebSocket<any>[]>();

    static addConnection(userId: number, ws: ServerWebSocket<any>) {
        const conns = this.connections.get(userId) || [];
        conns.push(ws);
        this.connections.set(userId, conns);
    }

    static removeConnection(userId: number, ws: ServerWebSocket<any>) {
        const conns = this.connections.get(userId);
        if (!conns) return;

        const newConns = conns.filter((c) => c !== ws);
        if (newConns.length === 0) {
            this.connections.delete(userId);
        } else {
            this.connections.set(userId, newConns);
        }
    }

    static send(userId: number, message: any) {
        const conns = this.connections.get(userId);
        if (conns) {
            const data = JSON.stringify(message);
            conns.forEach((ws) => ws.send(data));
        }
    }
}
