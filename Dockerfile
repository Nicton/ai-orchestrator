# NOTE: Using non-slim image to avoid apt GPG/signature failures during build.
# It includes the needed runtime deps (incl. OpenSSL for Prisma) without apt-get.
FROM node:22-bookworm

WORKDIR /app

# --- build metadata (versioning like api-repo) ---
ARG APP_VERSION="vLOCAL-DEV"
ARG GIT_SHA="unknown"
ARG BUILD_TIME="unknown"
ENV APP_VERSION=$APP_VERSION \
    GIT_SHA=$GIT_SHA \
    BUILD_TIME=$BUILD_TIME

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
