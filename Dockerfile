# Multi-stage Dockerfile for Real-time Crypto Dashboard
# Builds and runs both NestJS backend and React frontend

# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci && \
    npm cache clean --force

# Copy backend source
COPY backend/ ./

# Build backend
RUN npm run build

# Install production dependencies only (for final image)
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS production

WORKDIR /app

# Install serve for serving frontend static files
RUN npm install -g serve pm2

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/package.json

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy startup script
COPY docker-entrypoint.sh ./

# Make startup script executable
RUN chmod +x docker-entrypoint.sh

# Expose ports
# 3000 for backend WebSocket/API
# 5173 for frontend
EXPOSE 3000 5173

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start both services
ENTRYPOINT ["./docker-entrypoint.sh"]
