FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Build
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production
FROM node:20-slim
WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["node", "server.js"]
