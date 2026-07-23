# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ── Stage 2: nginx runtime ────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# Remove default config and copy ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/household.conf

# Copy built assets
COPY --from=build /app/dist .

# Runtime env injection via nginx's built-in entrypoint.d mechanism.
# VITE_API_BASE_URL="/api" by default: nginx proxies same-origin API calls
# internally to the household-api container.
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-env.sh && \
    echo 'set -e' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'API_BASE_URL="${API_BASE_URL:-${VITE_API_BASE_URL:-/api}}"' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'sed -i "s|HOUSEHOLD_API_URL_PLACEHOLDER|${API_BASE_URL}|g" /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'echo "[entrypoint] API_BASE_URL: ${API_BASE_URL}"' >> /docker-entrypoint.d/40-inject-env.sh && \
    chmod +x /docker-entrypoint.d/40-inject-env.sh

ENV VITE_API_BASE_URL=/api

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

