FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl git openssh-client ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Docker CLI + compose plugin (static) — used by the Ideas "implement" pipeline to
# redeploy via the mounted host docker socket. Daemon is NOT installed (uses host).
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.3.1.tgz | tar xz -C /tmp \
  && mv /tmp/docker/docker /usr/local/bin/docker && rm -rf /tmp/docker \
  && mkdir -p /usr/local/lib/docker/cli-plugins \
  && curl -fsSL -o /usr/local/lib/docker/cli-plugins/docker-compose https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-x86_64 \
  && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

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
