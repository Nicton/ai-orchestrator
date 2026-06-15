FROM node:22-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY core ./core
COPY skills ./skills
COPY scripts ./scripts
COPY src ./src

ENV NODE_ENV=production
EXPOSE 4321

# Default command overridden by docker-compose
CMD ["npm","run","start:app"]
