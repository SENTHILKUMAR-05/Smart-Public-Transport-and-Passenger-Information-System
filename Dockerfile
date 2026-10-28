# ==============================================================================
# Multi-stage Dockerfile: Full-Stack SPTPIS (Frontend + Express Socket.IO Backend)
# ==============================================================================

# Stage 1: Build React Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY sptpis/frontend/package*.json ./
RUN npm install
COPY sptpis/frontend ./
RUN npm run build

# Stage 2: Node.js Backend & Real-time Server
FROM node:20-alpine
WORKDIR /app

# Install native build tools for sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app/backend
COPY sptpis/backend/package*.json ./
RUN npm install --omit=dev

COPY sptpis/backend ./
# Copy compiled frontend into place for server.js static serving
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server.js"]
