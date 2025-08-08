# راهنمای نصب و راه‌اندازی داکر روی سرور

این راهنما نحوه نصب صحیح داکر و داکر کامپوز روی سرور و سپس اجرای پروژه را توضیح می‌دهد.

## نصب داکر

```bash
# به‌روزرسانی پکیج‌ها
sudo apt update

# نصب پکیج‌های مورد نیاز
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# اضافه کردن کلید GPG داکر
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# اضافه کردن مخزن داکر
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# نصب داکر
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# اضافه کردن کاربر به گروه داکر
sudo usermod -aG docker $USER
```

## نصب داکر کامپوز (روش 1 - استفاده از pip)

```bash
# نصب pip اگر نصب نیست
sudo apt install -y python3-pip

# نصب داکر کامپوز با pip
pip3 install docker-compose
```

## نصب داکر کامپوز (روش 2 - دانلود باینری)

```bash
# دانلود داکر کامپوز نسخه 2.20.2 (آخرین نسخه پایدار)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# دادن دسترسی اجرا
sudo chmod +x /usr/local/bin/docker-compose

# ایجاد لینک سمبلیک
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

## بررسی نصب

```bash
# بررسی نسخه داکر
docker --version

# بررسی نسخه داکر کامپوز
docker-compose --version
```

## اجرای پروژه با داکر

### 1. دریافت کد پروژه

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 2. اجرای پروژه با داکر کامپوز

```bash
# اجرای داکر کامپوز با فایل ساده
docker-compose up -d
```

اگر با خطای زیر مواجه شدید:
```
File "/usr/bin/docker-compose", line 10, in <module>
    from importlib.metadata import distribution
...
KeyboardInterrupt
```

از روش زیر استفاده کنید:

```bash
# استفاده از داکر کامپوز به صورت مستقیم
/usr/local/bin/docker-compose up -d
```

یا از داکر کامپوز پلاگین استفاده کنید:

```bash
docker compose up -d
```

### 3. بررسی وضعیت کانتینرها

```bash
docker ps
```

### 4. مشاهده لاگ‌ها

```bash
docker logs nextjs
```

## رفع مشکلات احتمالی

### مشکل داکر کامپوز

اگر با مشکل داکر کامپوز مواجه هستید، می‌توانید از دستورات مستقیم داکر استفاده کنید:

```bash
# ساخت شبکه
docker network create app-network

# اجرای MySQL
docker run -d --name mysql \
  --network app-network \
  -e MYSQL_ROOT_PASSWORD=1234 \
  -e MYSQL_DATABASE=crm_system \
  -v mysql_data:/var/lib/mysql \
  -v $(pwd)/crm_system.sql:/docker-entrypoint-initdb.d/crm_system.sql \
  mariadb:10.5

# ساخت ایمیج Next.js
docker build -t nextjs-app .

# اجرای Next.js
docker run -d --name nextjs \
  --network app-network \
  -e DATABASE_URL=mysql://root:1234@mysql:3306/crm_system \
  -e DATABASE_HOST=mysql \
  -e NODE_ENV=production \
  nextjs-app

# اجرای Nginx
docker run -d --name nginx-proxy \
  --network app-network \
  -p 80:80 -p 443:443 \
  -v $(pwd)/nginx/default.conf:/etc/nginx/conf.d/default.conf \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /etc/ssl:/etc/ssl:ro \
  nginx:latest

# اجرای PHPMyAdmin
docker run -d --name phpmyadmin \
  --network app-network \
  -e PMA_HOST=mysql \
  -e PMA_PORT=3306 \
  -e MYSQL_ROOT_PASSWORD=1234 \
  phpmyadmin/phpmyadmin
```

### مشکل کمبود حافظه

اگر با مشکل کمبود حافظه مواجه هستید:

```bash
# ایجاد فایل swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab