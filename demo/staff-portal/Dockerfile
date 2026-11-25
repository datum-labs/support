# syntax=docker/dockerfile:1
# ==========================================
# BASE STAGE - Common dependencies and setup
# ==========================================
FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS base

# Fail the build if the compromised emSign ECC Root CA - G3 comes back. Node
# checks TLS against roots built into its binary, so test those; the system
# bundle only counts if --use-system-ca is ever turned on, so test it too.
RUN apk add --no-cache --upgrade 'ca-certificates>=20261020-r0'
RUN ! grep -q MIICTjCCAdOgAwIBAgIKPPYHqWhwDtqLhDAKBggqhkjOPQQDAzBrMQswCQYDVQQG /etc/ssl/certs/ca-certificates.crt
RUN node -e 'const tls = require("node:tls"); const { X509Certificate } = require("node:crypto"); if (tls.rootCertificates.some((pem) => new X509Certificate(pem).subject.split("\n").includes("CN=emSign ECC Root CA - G3"))) { console.error("Node trusts emSign ECC Root CA - G3"); process.exit(1); }'

# Set working directory and environment variables
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# ==========================================
# BUILD STAGE - Compile and prepare the app
# ==========================================
FROM base AS build

ARG SENTRY_AUTH_TOKEN
ARG VERSION=dev

# Set environment variables
ENV VERSION=${VERSION}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

# Install dependencies first (better layer caching)
COPY --link package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev --ignore-scripts --no-audit --no-fund

# Copy application code
COPY --link . .

# Build application and clean up
RUN npm run build && \
    npm prune --omit=dev --ignore-scripts --no-audit --no-fund && \
    touch .env

# ==========================================
# PRODUCTION STAGE - Final lightweight image
# ==========================================
FROM base

# Accept VERSION as build argument and set as environment variable
ARG VERSION=dev
ENV VERSION=${VERSION}

# Use non-root user for better security
RUN addgroup -g 1001 datum && \
    adduser -u 1001 -G datum -D -H datum && \
    chown datum:datum /app

# Copy only necessary files from build stage
COPY --from=build --chown=datum:datum /app/build /app/build
COPY --from=build --chown=datum:datum /app/public /app/public
COPY --from=build --chown=datum:datum /app/package.json /app/package.json
COPY --from=build --chown=datum:datum /app/node_modules /app/node_modules
COPY --from=build --chown=datum:datum /app/.env /app/.env
COPY --from=build --chown=datum:datum /app/observability /app/observability

# Expose port
EXPOSE ${PORT}

USER datum

# Start the application
CMD ["node", "--env-file-if-exists=.env", "./observability/start.js"]
