# Mycelium Deployment Guide

This guide explains how to deploy the Mycelium backend stack using Docker Compose.

## Prerequisites
- [Docker](https://www.docker.com/) installed and running.

## Architecture
The deployment consists of three services:
1.  **`app`**: The Bun backend server (Port 3000).
2.  **`db`**: PostgreSQL database (Port 5433 host / 5432 container).
3.  **`redis`**: Redis for queue management (Port 6379).

## How to Run

1.  **Stop local services**:
    If you are running the app or database locally, stop them to avoid port conflicts.
    ```bash
    # Stop local bun server
    Ctrl+C
    
    # If you have local postgres on 5433, stop it
    ```

2.  **Build and Start**:
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs it in detached mode.

3.  **Verify**:
    - **API**: [http://localhost:3000](http://localhost:3000)
    - **Docs**: [http://localhost:3000/reference](http://localhost:3000/reference)

4.  **Database Migration**:
    The current setup assumes the database schema is managed. Since the app does not auto-migrate on startup in `src/index.ts`, you might need to run migrations.
    
    **Option A (Recommended):** Run migrations from your host if you have `bun` installed:
    ```bash
    # Ensure DATABASE_URL points to localhost:5433
    export DATABASE_URL=postgres://mycelium:password@localhost:5433/mycelium
    bunx drizzle-kit push
    ```

    **Option B:** Run inside container (if migrations files exist):
    ```bash
    docker-compose exec app bunx drizzle-kit push
    ```

    *Note: The current Dockerfile copies the source, so `drizzle-kit` should work if devDependencies are installed or npx is available.*

## Troubleshooting
- **Logs**: `docker-compose logs -f`
- **Rebuild**: `docker-compose up --build`
