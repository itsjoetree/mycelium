# 🍄 Mycelium

**Mycelium** is a decentralized resource exchange platform specifically designed for urban farming communities. It enables neighbors to trade surplus produce, tools, and seeds, building a resilient local food network.

## ✨ Features

-   **🔄 Advanced Trade Engine**: Robust state-machine based trading system with PENDING, ACCEPTED, and COMPLETED states.
-   **📦 Resource Management**: Inventory tracking with geospatial support (latitude/longitude) for local discovery.
-   **⚡ Real-time Updates**: Instant notifications and UI feedback via WebSockets.
-   **🔐 Secure Authentication**: Session-based auth with Argon2id password hashing and strict ownership enforcement.
-   **📖 API Documentation**: Auto-generated interactive API reference using Scalar and OpenAPI/Zod.

## 🛠 Tech Stack

### Backend
-   **Runtime**: [Bun](https://bun.sh) (v1.1.x)
-   **Framework**: [Hono](https://hono.dev) (Fast, lightweight, standards-based)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) (via Docker)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/) (TypeScript-first SQL)
-   **Task Queue**: [BullMQ](https://docs.bullmq.io/) & Redis

### Frontend
-   **Framework**: [React](https://react.dev/) (Vite-based)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query)
-   **Routing**: [React Router](https://reactrouter.com/)

## 🚀 Getting Started

### Prerequisites
-   [Bun](https://bun.sh) installed
-   [Docker](https://www.docker.com/) and Docker Compose (for PostgreSQL)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/itsjoetree/mycelium.git
    cd mycelium
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.example .env
    ```

### Running Locally
Start both the backend and frontend in development mode:
```bash
bun run dev
```
-   **API**: [http://localhost:3000](http://localhost:3000)
-   **Frontend**: [http://localhost:5173](http://localhost:5173)
-   **API Reference**: [http://localhost:3000/reference](http://localhost:3000/reference)

## 📁 Project Structure

```text
├── frontend/             # Vite + React + Tailwind frontend
├── src/                  # Bun + Hono backend
│   ├── modules/          # Feature-sliced modules (auth, resources, trades)
│   ├── db/               # Drizzle schema and migrations
│   ├── lib/              # Core utilities (WS, middleware, rate-limiting)
│   └── index.ts          # Server entrypoint
├── tests/                # Integration and unit tests
├── drizzle/              # Generated SQL migrations
└── docker-compose.yml    # Infrastructure (PostgreSQL, Redis)
```

## ⚖️ License
MIT
