FROM node:18-alpine

WORKDIR /app

# بهینه‌سازی برای سرور ضعیف - محدود کردن استفاده از رم
ENV NODE_OPTIONS="--max-old-space-size=1024"

# کپی فایل‌های package
COPY package*.json ./

# نصب dependencies (همه dependencies نه فقط production)
RUN npm ci

# کپی تنظیمات TypeScript و Next.js
COPY tsconfig.json ./
COPY next.config.js ./

# کپی کل پروژه
COPY . .

# اطمینان از وجود فایل‌های مورد نیاز
RUN ls -la components/ui/

# Build پروژه
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]