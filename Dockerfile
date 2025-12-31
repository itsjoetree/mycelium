FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies (cached if package.json unchanged)
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Start server
CMD ["bun", "run", "src/index.ts"]
