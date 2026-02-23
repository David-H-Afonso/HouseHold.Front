# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html

# Remove default config and copy ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/household.conf

# Copy built assets
COPY --from=build /app/dist .

# Runtime env injection via nginx's built-in entrypoint.d mechanism.
# API_BASE_URL="" by default → nginx proxies API calls internally to household-api.
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-env.sh && \
    echo 'set -e' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'API_BASE_URL="${API_BASE_URL:-}"' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'sed -i "s|HOUSEHOLD_API_URL_PLACEHOLDER|${API_BASE_URL}|g" /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo '' >> /docker-entrypoint.d/40-inject-env.sh && \
    echo 'echo "[entrypoint] API_BASE_URL: ${API_BASE_URL:-<empty - using nginx proxy>}"' >> /docker-entrypoint.d/40-inject-env.sh && \
    chmod +x /docker-entrypoint.d/40-inject-env.sh

ENV API_BASE_URL=

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

