FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY services/connaissance/package.json services/connaissance/package.json
RUN npm ci --workspace @yaka-bridge/service-connaissance --include-workspace-root

FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY services/connaissance ./services/connaissance
WORKDIR /app/services/connaissance
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3200
COPY --from=builder /app/services/connaissance/.next/standalone ./
COPY --from=builder /app/services/connaissance/.next/static ./services/connaissance/.next/static
COPY --from=builder /app/services/connaissance/public ./services/connaissance/public
EXPOSE 3200
CMD ["node", "services/connaissance/server.js"]
