FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY src ./src
COPY README.md API_DOCUMENTATION.md FRONTEND_INTEGRATION.md ./
RUN npx prisma generate && addgroup -S app && adduser -S app -G app
USER app
EXPOSE 5000
CMD ["node","src/server.js"]
