FROM node:18-alpine

# Set working directory to root instead of /app to avoid path duplication
WORKDIR /usr/src

# Skip installing curl and use a simpler health check
# We'll use wget which is already available in Alpine

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security (Alpine syntax)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the application directory
RUN chown -R nextjs:nodejs /usr/src
USER nextjs

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check using wget instead of curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
