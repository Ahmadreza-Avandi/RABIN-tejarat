# RABIN-tejarat CRM Production Deployment Guide

This guide provides detailed instructions for deploying the RABIN-tejarat CRM system on a production server.

## Prerequisites

- A Linux server (Ubuntu 20.04 LTS or later recommended)
- Domain name pointing to your server
- Docker and Docker Compose installed
- Git installed
- Basic knowledge of Linux command line

## Server Setup

### 1. Install Docker and Docker Compose

```bash
# Update package index
sudo apt update

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group to run Docker without sudo
sudo usermod -aG docker $USER
```

Log out and log back in for the group changes to take effect.

### 2. Clone the Repository

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 3. Configure Environment Variables

Create a production environment file:

```bash
cp .env.example .env.production
```

Edit the `.env.production` file and update the following variables:

```bash
# Use your favorite text editor
nano .env.production
```

Important variables to update:

- `DATABASE_PASSWORD`: Set a secure password for the MySQL database
- `DATABASE_NAME`: Set the database name (default: crm_system)
- `JWT_SECRET`: Set a secure random string for JWT authentication
- `NEXTAUTH_SECRET`: Set a secure random string for NextAuth
- `NEXTAUTH_URL`: Set to your domain name (e.g., https://your-domain.com)
- `EMAIL_USER`: Your email address for sending emails
- `EMAIL_PASS`: Your email app password
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: Your Google OAuth credentials (if using Gmail)
- `DOMAIN_NAME`: Your domain name (e.g., your-domain.com)

## SSL Certificate Setup

### 1. Create Directories for Certbot

```bash
mkdir -p certbot/conf
mkdir -p certbot/www
```

### 2. Initial Deployment Without SSL

For the first deployment, we'll use HTTP to obtain SSL certificates:

```bash
# Create a temporary Nginx configuration for HTTP
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

# Create a temporary docker-compose file
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

# Start the temporary setup
export DOMAIN_NAME=your-domain.com
docker-compose -f docker-compose.init.yml up -d
```

### 3. Obtain SSL Certificate

```bash
# Request a certificate
docker-compose -f docker-compose.init.yml run --rm certbot certonly --webroot -w /var/www/certbot -d your-domain.com --email your-email@example.com --agree-tos --no-eff-email

# Stop the temporary containers
docker-compose -f docker-compose.init.yml down
```

## Full Deployment

### 1. Start the Production Environment

```bash
# Make sure the Nginx script is executable
chmod +x nginx/nginx.sh

# Start all services
docker-compose -f docker-compose.production.yml up -d
```

### 2. Initialize the Database

The database will be automatically initialized with the schema from `crm_system.sql`. If you need to manually initialize or restore the database, you can use:

```bash
docker exec -i mysql mysql -uroot -p<your-password> crm_system < crm_system.sql
```

### 3. Access the Application

- Main application: https://your-domain.com
- phpMyAdmin: https://your-domain.com/phpmyadmin

## Maintenance

### Updating the Application

To update the application with the latest changes:

```bash
git pull
docker-compose -f docker-compose.production.yml up -d --build
```

### Renewing SSL Certificates

Certificates will be automatically renewed by the certbot container. You can manually trigger a renewal with:

```bash
docker-compose -f docker-compose.production.yml run --rm certbot renew
```

### Viewing Logs

To view logs for any container:

```bash
docker-compose -f docker-compose.production.yml logs -f [service-name]
```

Where `[service-name]` can be `nextjs`, `mysql`, `nginx`, `certbot`, or `phpmyadmin`.

## Troubleshooting

### Database Connection Issues

If the application cannot connect to the database:

1. Check if the MySQL container is running:
   ```bash
   docker-compose -f docker-compose.production.yml ps
   ```

2. Verify the database credentials in `.env.production`

3. Check the MySQL logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs mysql
   ```

### SSL Certificate Issues

If you encounter SSL certificate issues:

1. Check the certbot logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs certbot
   ```

2. Verify that the certificate files exist:
   ```bash
   ls -la certbot/conf/live/your-domain.com/
   ```

3. Make sure the Nginx configuration is using the correct paths to the certificate files.

### Application Errors

If the Next.js application is not working:

1. Check the application logs:
   ```bash
   docker-compose -f docker-compose.production.yml logs nextjs
   ```

2. Verify that all environment variables are correctly set in `.env.production`

3. Rebuild the application:
   ```bash
   docker-compose -f docker-compose.production.yml up -d --build nextjs
   ```

## Security Considerations

- Change default database passwords in production
- Use strong, unique passwords for all services
- Keep Docker and all containers updated
- Configure a firewall to restrict access to necessary ports only
- Consider setting up basic authentication for phpMyAdmin
- Regularly backup your database and configuration

## Backup and Restore

### Backing Up the Database

```bash
docker exec mysql mysqldump -u root -p<your-password> crm_system > backup_$(date +%Y%m%d).sql
```

### Restoring the Database

```bash
docker exec -i mysql mysql -u root -p<your-password> crm_system < backup_file.sql
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)