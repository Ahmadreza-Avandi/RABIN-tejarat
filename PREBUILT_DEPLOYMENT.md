# راهنمای استقرار پیش‌ساخته برای RABIN-tejarat CRM

این راهنما برای سرورهایی که با مشکل کمبود حافظه در هنگام ساخت پروژه مواجه هستند، طراحی شده است. در این روش، پروژه را روی کامپیوتر محلی خود می‌سازید و سپس فقط فایل‌های ساخته شده را به سرور منتقل می‌کنید.

## مرحله 1: ساخت پروژه روی کامپیوتر محلی

### پیش‌نیازها

- Node.js نسخه 18 یا بالاتر
- Git
- npm یا yarn
- Docker (اختیاری)

### دریافت و ساخت پروژه

1. کد پروژه را از مخزن گیت‌هاب دریافت کنید:

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

2. وابستگی‌ها را نصب کنید:

```bash
npm install
```

3. فایل `.env.local` را برای محیط توسعه ایجاد کنید:

```bash
cp .env.example .env.local
# ویرایش فایل .env.local با اطلاعات محلی
```

4. پروژه را بسازید:

```bash
# افزایش حافظه Node.js برای جلوگیری از خطای کمبود حافظه
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build
```

5. فایل‌های ساخته شده را فشرده کنید:

```bash
# ایجاد پوشه برای فایل‌های ساخته شده
mkdir -p deployment
# کپی فایل‌های مورد نیاز
cp -r .next package.json package-lock.json public deployment/
# فشرده‌سازی
tar -czvf rabin-tejarat-build.tar.gz deployment/
```

## مرحله 2: ایجاد Dockerfile برای اجرای برنامه پیش‌ساخته

فایل `Dockerfile.runtime` را با محتوای زیر ایجاد کنید:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# کپی فایل‌های ساخته شده
COPY deployment/.next ./.next
COPY deployment/public ./public
COPY deployment/package*.json ./

# نصب وابستگی‌های تولید
RUN npm ci --only=production

# ایجاد کاربر غیر-روت
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# تنظیم متغیرهای محیطی
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# پورت برنامه
EXPOSE 3000

# بررسی سلامت
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

# اجرای برنامه
CMD ["npm", "start"]
```

## مرحله 3: انتقال فایل‌ها به سرور

### روش 1: استفاده از SCP

1. فایل فشرده را به سرور منتقل کنید:

```bash
scp rabin-tejarat-build.tar.gz user@your-server-ip:/path/to/destination/
```

2. فایل‌های پیکربندی داکر را به سرور منتقل کنید:

```bash
scp Dockerfile.runtime docker-compose.production.yml nginx/production.conf nginx/nginx.sh user@your-server-ip:/path/to/destination/
```

### روش 2: استفاده از Docker Hub (توصیه می‌شود)

1. ایجاد تصویر داکر محلی:

```bash
# استخراج فایل‌های فشرده
mkdir -p build_context
tar -xzvf rabin-tejarat-build.tar.gz -C build_context
cp Dockerfile.runtime build_context/Dockerfile

# ساخت تصویر داکر
cd build_context
docker build -t your-dockerhub-username/rabin-tejarat:latest .
```

2. ارسال تصویر به Docker Hub:

```bash
docker login
docker push your-dockerhub-username/rabin-tejarat:latest
```

## مرحله 4: راه‌اندازی پروژه روی سرور

### روش 1: استفاده از فایل‌های منتقل شده

1. به سرور متصل شوید:

```bash
ssh user@your-server-ip
```

2. به مسیر مورد نظر بروید و فایل فشرده را استخراج کنید:

```bash
cd /path/to/destination/
mkdir -p RABIN-tejarat
tar -xzvf rabin-tejarat-build.tar.gz -C RABIN-tejarat
cd RABIN-tejarat
```

3. فایل‌های پیکربندی داکر را در مسیر مناسب قرار دهید:

```bash
mkdir -p nginx
mv ../production.conf nginx/production.conf
mv ../nginx.sh nginx/nginx.sh
mv ../Dockerfile.runtime .
mv ../docker-compose.production.yml .
chmod +x nginx/nginx.sh
```

4. فایل docker-compose را برای استفاده از Dockerfile.runtime ویرایش کنید:

```bash
sed -i 's/Dockerfile.production/Dockerfile.runtime/g' docker-compose.production.yml
```

5. فایل `.env.production` را ایجاد و تنظیم کنید:

```bash
cp ../deployment/.env.production .env.production
# در صورت نیاز، فایل .env.production را ویرایش کنید
```

6. ایجاد پوشه‌های مورد نیاز برای certbot:

```bash
mkdir -p certbot/conf certbot/www
```

7. سرویس‌ها را راه‌اندازی کنید:

```bash
docker-compose -f docker-compose.production.yml up -d
```

### روش 2: استفاده از تصویر Docker Hub

1. به سرور متصل شوید:

```bash
ssh user@your-server-ip
```

2. فایل docker-compose.hub.yml را ایجاد کنید:

```bash
cat > docker-compose.hub.yml << 'EOF'
version: '3.8'

services:
  mysql:
    image: mariadb:10.5
    env_file:
      - .env.production
    environment:
      MYSQL_ROOT_PASSWORD: ${DATABASE_PASSWORD}
      MYSQL_DATABASE: ${DATABASE_NAME}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./crm_system.sql:/docker-entrypoint-initdb.d/crm_system.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-p${DATABASE_PASSWORD}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: always
    networks:
      - app-network

  nextjs:
    image: your-dockerhub-username/rabin-tejarat:latest
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
    volumes:
      - ./public/uploads:/app/public/uploads
    depends_on:
      mysql:
        condition: service_healthy
    restart: always
    networks:
      - app-network
    container_name: nextjs

  nginx:
    image: nginx:latest
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN_NAME=${DOMAIN_NAME:-localhost}
    volumes:
      - ./nginx/production.conf:/etc/nginx/conf.d/default.conf.template
      - ./nginx/nginx.sh:/docker-entrypoint.d/40-nginx-config.sh
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - nextjs
    networks:
      - app-network
    command: /bin/bash -c "envsubst '$$DOMAIN_NAME' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - nginx
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: phpmyadmin
    env_file:
      - .env.production
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      MYSQL_ROOT_PASSWORD: ${DATABASE_PASSWORD}
    depends_on:
      - mysql
    networks:
      - app-network
    restart: always

networks:
  app-network:
    driver: bridge

volumes:
  mysql_data: {}
EOF
```

3. فایل‌های پیکربندی Nginx را دریافت کنید:

```bash
mkdir -p nginx
curl -o nginx/production.conf https://raw.githubusercontent.com/Ahmadreza-Avandi/RABIN-tejarat/main/nginx/production.conf
curl -o nginx/nginx.sh https://raw.githubusercontent.com/Ahmadreza-Avandi/RABIN-tejarat/main/nginx/nginx.sh
chmod +x nginx/nginx.sh
```

4. فایل `.env.production` را ایجاد و تنظیم کنید:

```bash
curl -o .env.example https://raw.githubusercontent.com/Ahmadreza-Avandi/RABIN-tejarat/main/.env.example
cp .env.example .env.production
# ویرایش فایل .env.production با اطلاعات سرور
```

5. ایجاد پوشه‌های مورد نیاز برای certbot:

```bash
mkdir -p certbot/conf certbot/www
```

6. دریافت فایل SQL پایگاه داده:

```bash
curl -o crm_system.sql https://raw.githubusercontent.com/Ahmadreza-Avandi/RABIN-tejarat/main/crm_system.sql
```

7. سرویس‌ها را راه‌اندازی کنید:

```bash
docker-compose -f docker-compose.hub.yml up -d
```

## مرحله 5: تنظیم SSL

برای تنظیم SSL، مراحل مشابه با راهنمای `PRODUCTION_DEPLOYMENT.md` را دنبال کنید:

1. ابتدا یک پیکربندی موقت برای Nginx ایجاد کنید:

```bash
# ایجاد فایل پیکربندی موقت Nginx
cat > nginx/init-letsencrypt.conf << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 "Ready for SSL setup!";
    }
}
EOF

# ایجاد فایل docker-compose موقت
cat > docker-compose.init.yml << 'EOF'
version: '3.8'

services:
  nginx:
    image: nginx:latest
    container_name: nginx-init
    ports:
      - "80:80"
    environment:
      - DOMAIN_NAME=${DOMAIN_NAME}
    volumes:
      - ./nginx/init-letsencrypt.conf:/etc/nginx/conf.d/default.conf.template
      - ./nginx/nginx.sh:/docker-entrypoint.d/40-nginx-config.sh
      - ./certbot/www:/var/www/certbot
    command: /bin/bash -c "envsubst '$$DOMAIN_NAME' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"

  certbot:
    image: certbot/certbot
    container_name: certbot-init
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - nginx
EOF
```

2. راه‌اندازی موقت و دریافت گواهی SSL:

```bash
export DOMAIN_NAME=your-domain.com
docker-compose -f docker-compose.init.yml up -d
docker-compose -f docker-compose.init.yml run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com --email your-email@example.com --agree-tos --no-eff-email
docker-compose -f docker-compose.init.yml down
```

3. راه‌اندازی مجدد سرویس‌ها با SSL:

```bash
# اگر از روش 1 استفاده می‌کنید:
docker-compose -f docker-compose.production.yml up -d

# اگر از روش 2 استفاده می‌کنید:
docker-compose -f docker-compose.hub.yml up -d
```

## نکات مهم

### بروزرسانی برنامه

برای بروزرسانی برنامه، مراحل زیر را دنبال کنید:

1. ساخت مجدد پروژه روی کامپیوتر محلی
2. ایجاد تصویر داکر جدید و ارسال به Docker Hub (اگر از روش 2 استفاده می‌کنید)
3. راه‌اندازی مجدد سرویس‌ها روی سرور:

```bash
# اگر از روش 1 استفاده می‌کنید:
docker-compose -f docker-compose.production.yml up -d --build nextjs

# اگر از روش 2 استفاده می‌کنید:
docker pull your-dockerhub-username/rabin-tejarat:latest
docker-compose -f docker-compose.hub.yml up -d
```

### عیب‌یابی

اگر با مشکلی مواجه شدید، لاگ‌های سرویس‌ها را بررسی کنید:

```bash
docker-compose -f docker-compose.production.yml logs -f [service-name]
# یا
docker-compose -f docker-compose.hub.yml logs -f [service-name]
```

این روش به شما امکان می‌دهد حتی با سرورهایی که حافظه محدودی دارند، پروژه را به راحتی مستقر کنید، زیرا مرحله ساخت پروژه که نیاز به حافظه زیادی دارد، روی کامپیوتر محلی شما انجام می‌شود.