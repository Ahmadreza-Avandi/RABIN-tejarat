# Server Deployment Guide for CEM-CRM

This is a simplified guide for deploying the CEM-CRM system on your server using the new Docker setup.

## Prerequisites

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Docker and Docker Compose installed
- Git installed
- Domain name pointing to your server (for production)

## Quick Deployment Steps

### 1. Clone the repository on your server

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 2. Clean Docker environment (optional but recommended)

```bash
# Make the cleanup script executable
chmod +x docker-cleanup.sh

# Run the cleanup script
./docker-cleanup.sh
```

### 3. Configure environment variables

```bash
# Copy the example environment file
cp .env.example .env.production
```

Edit the `.env.production` file with your server settings:

```bash
# Use your favorite text editor
nano .env.production
```

Make sure to update:
- Database credentials
- JWT and NextAuth secrets
- Email configuration
- Google OAuth settings (if using Gmail)
- Set DOMAIN_NAME to your server domain

### 4. Start the Docker containers for production

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 5. Access the application

- Main application: https://your-domain.com
- phpMyAdmin: https://your-domain.com/phpmyadmin (accessible only within Docker network for security)

## SSL Certificate Setup

For production deployment with SSL:

1. Create directories for Certbot:
   ```bash
   mkdir -p certbot/conf
   mkdir -p certbot/www
   ```

2. Obtain SSL certificate:
   ```bash
   docker-compose -f docker-compose.production.yml run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com --email your-email@example.com --agree-tos --no-eff-email
   ```

3. Restart Nginx to apply the certificate:
   ```bash
   docker-compose -f docker-compose.production.yml restart nginx
   ```

## Troubleshooting

### Database Connection Issues

If the application cannot connect to the database:

1. Check if the MySQL container is running:
   ```bash
   docker-compose -f docker-compose.production.yml ps
   ```

2. Check MySQL logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs mysql
   ```

3. Verify the database was imported correctly:
   ```bash
   docker exec mysql mysql -uroot -p<your-password> -e "SHOW DATABASES;"
   ```

### Application Errors

If the Next.js application is not working:

1. Check the application logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs nextjs
   ```

2. Rebuild the application:
   ```bash
   docker-compose -f docker-compose.production.yml up -d --build nextjs
   ```

## Memory Issues During Build

If you encounter memory issues during the build process:

1. Add swap space to your server:
   ```bash
   sudo fallocate -l 8G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. Make swap permanent:
   ```bash
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

## Updating the Application

To update the application with the latest changes:

```bash
git pull
docker-compose -f docker-compose.production.yml up -d --build
```

## Security Considerations

- Use strong, unique passwords for all services
- Keep Docker and all containers updated
- Configure a firewall to restrict access to necessary ports only
- Regularly backup your database and configuration

For more detailed deployment instructions, see the full [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md).