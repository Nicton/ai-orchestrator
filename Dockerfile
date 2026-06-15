FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Claude Code CLI — primary engine for answer generation (auth via mounted ~/.claude).
RUN npm install -g @anthropic-ai/claude-code && claude --version || true

COPY prisma ./prisma
RUN npx prisma generate

COPY core ./core
COPY knowledge-base ./knowledge-base
COPY docs ./docs
COPY product ./product
COPY workspaces ./workspaces
COPY skills ./skills
COPY scripts ./scripts
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4321

# Default command overridden by docker-compose
CMD ["npm","run","start:app"]
