# Production Dockerfile for RazorRecover Backend & Worker Services
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Default command starts the Express API server
CMD ["node", "src/server.js"]
