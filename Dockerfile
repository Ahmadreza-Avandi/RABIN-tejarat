FROM node:18-alpine

WORKDIR /app

# با 4GB swap می‌تونیم memory بیشتری استفاده کنیم
ENV NODE_OPTIONS="--max-old-space-size=2500"

# کپی فایل‌های package
COPY package*.json ./

# نصب dependencies و پاک کردن کش
RUN npm ci --prefer-offline --no-audit --progress=false && \
    npm cache clean --force

# کپی تنظیمات
COPY tsconfig.json ./
COPY next.config.js ./

# کپی فقط فایل‌های ضروری
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY styles ./styles

# Build پروژه
RUN npm run build && \
    rm -rf node_modules && \
    npm ci --only=production --prefer-offline --no-audit --progress=false && \
    npm cache clean --force

# کاهش memory برای runtime
ENV NODE_OPTIONS="--max-old-space-size=400"
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]