# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:18 AS builder
WORKDIR /app

# Set up swap space to handle memory spikes
RUN fallocate -l 2G /swapfile && \
    chmod 600 /swapfile && \
    mkswap /swapfile && \
    swapon /swapfile

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with increased memory
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from build stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]