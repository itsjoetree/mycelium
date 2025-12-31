# Mycelium Architecture Reference

This document provides a technical overview of the **Mycelium** backend, a decentralized resource exchange built with **Bun**, **Hono**, **Drizzle**, and **PostgreSQL**.

## 1. System Overview

Mycelium is designed as a monolithic API service with a modular internal structure. It prioritizes performance (via Bun/Hono) and data integrity (via PostgreSQL ACID transactions).

### Core Stack
*   **Runtime**: [Bun v1.1.x](https://bun.sh) - JavaScript runtime, bundler, and test runner.
*   **Web Framework**: [Hono](https://hono.dev) - Lightweight, standards-based server.
    *   *Features*: Native Bun WebSocket support, Zod OpenAPI validation.
*   **Database**: PostgreSQL 15 (Docker).
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team) - TypeScript-first SQL schema definition.

---

## 2. Data & Graph Model

While strictly relational, the data model forms a graph of users, resources, and interactions.

### The "Social Graph" (Trust Network)
**Nodes**: Users
**Edges**: Trades
*   defined in `src/db/schema/trades.ts`
*   **Relationship**: `User (Initiator) --[TRADE]--> User (Receiver)`
*   Every accepted trade builds a weighted edge of trust between two nodes.

### The "Resource Graph" (Ownership)
**Nodes**: Users, Resources
**Edges**: Ownership (Foreign Key)
*   defined in `src/db/schema/resources.ts`
*   **Relationship**: `User --[OWNS]--> Resource`

### The "Transaction Graph" (Flow)
**Nodes**: Trades, Resources
**Edges**: Trade Items
*   defined in `trade_items` table.
*   **Relationship**: `Trade --[CONTAINS]--> Resource`

---

## 3. Key Modules

### A. Authentication (`src/modules/auth`)
*   **Strategy**: Custom Session-based.
*   **Security**:
    *   Passwords: Hashed via **Argon2id**.
    *   Sessions: Stored in DB, tied to `HttpOnly` + `Secure` + `SameSite=Strict` cookies.
    *   **Strict Ownership**: Middleware/Helpers enforce that users can only modify their own data.

### B. Resources (`src/modules/resources`)
*   **Purpose**: Inventory management.
*   **Features**:
    *   Geospatial attributes (`latitude`, `longitude`) for future map features.
    *   Status tracking (`available` -> `traded`).

### C. Trade Engine (`src/modules/trades`)
*   **Purpose**: The core logic center.
*   **Design Pattern**: State Machine + Transactional Script.
*   **Lifecycle**:
    `PENDING` --> `ACCEPTED` (Resources locked/transferred) --> `COMPLETED`
*   **Concurrency Control**:
    *   Uses **Optimistic Locking** validation within `SERIALIZABLE` or default isolation transactions to ensure resources aren't traded twice simultaneously.
    *   **Strict Validation**: Enforces that all resources in a transaction belong to the participating parties.

### D. Real-time Communication (`src/lib/ws.ts`)
*   **Protocol**: Native WebSockets (via `hono/bun`).
*   **Message Flow**:
    1.  User connects to `/ws` (Auth via Cookie).
    2.  `WebSocketManager` maps `UserId -> WebSocket[]`.
    3.  Service Layer (`TradeService`) calls `WebSocketManager.send(userId, payload)` to push alerts.

---

## 4. Directory Structure Map

```
src/
├── db/
│   ├── index.ts             # Database connection pool (Postgres.js)
│   └── schema/              # Single source of truth for Data Model
│       ├── users.ts
│       ├── resources.ts
│       └── trades.ts
├── modules/                 # Feature-sliced Design
│   ├── auth/                # Login, Register, Cookies
│   ├── resources/           # CRUD for Items
│   └── trades/              # Complex Trade Logic & Validation
├── lib/
│   ├── middleware.ts        # Global Error Handling
│   └── ws.ts                # WebSocket Connection Manager
└── index.ts                 # Application Entrypoint & Routing
```
