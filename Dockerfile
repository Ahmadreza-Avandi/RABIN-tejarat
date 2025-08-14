FROM node:18-alpine

WORKDIR /app

# بهینه‌سازی برای سرور ضعیف - محدود کردن استفاده از رم
ENV NODE_OPTIONS="--max-old-space-size=1024"

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]