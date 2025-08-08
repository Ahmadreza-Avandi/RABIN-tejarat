# Docker Setup for CEM-CRM

This document provides instructions for setting up the CEM-CRM application using Docker for both local development and production deployment.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned to your local machine

## File Structure

- `Dockerfile`: Multi-stage build for the Next.js application
- `docker-compose.yml`: Configuration for local development
- `docker-compose.production.yml`: Configuration for production deployment
- `docker-cleanup.sh`: Script to clean Docker cache and previous data

## Local Development Setup

### 1. Clean Docker Environment (Optional)

If you want to start with a clean Docker environment, run:

```bash
./docker-cleanup.sh
```

### 2. Start the Application

```bash
docker-compose up -d
```

This will:
- Start a MySQL database container with the CRM database
- Build and start the Next.js application
- Set up Nginx as a reverse proxy
- Start PHPMyAdmin for database management

### 3. Access the Application

- Next.js application: http://localhost:3000
- PHPMyAdmin: http://localhost:8080 (username: root, password: 1234)

## Production Deployment

### 1. Set Environment Variables

Create a `.env.local` file for local development or `.env.production` for production with your settings:

```
# Database Configuration
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=crm_system

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password

# Google OAuth Configuration (if using Gmail)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token

# Server Configuration
DOMAIN_NAME=your-domain.com
```

**Important:** Never commit your actual credentials to Git. The `.env.local` and `.env.production` files should be added to your `.gitignore` file.

### 2. Clean Docker Environment (Optional)

```bash
./docker-cleanup.sh
```

### 3. Start the Application

```bash
docker-compose -f docker-compose.production.yml up -d
```

### 4. Access the Application

- Production application: https://your-domain.com
- PHPMyAdmin: Available only within the Docker network for security

## Database Import

The database is automatically imported from the `crm_system.sql` file in the root directory when the MySQL container starts for the first time. If you need to reimport the database:

1. Stop the containers:
   ```bash
   docker-compose down
   ```

2. Remove the MySQL volume:
   ```bash
   docker volume rm cem-crm-main_mysql_data
   ```

3. Restart the containers:
   ```bash
   docker-compose up -d
   ```

## Troubleshooting

### Container Logs

To view logs for a specific container:

```bash
docker logs nextjs
docker logs mysql
docker logs nginx-proxy
```

### Database Connection Issues

If the Next.js application cannot connect to the database:

1. Ensure the MySQL container is running:
   ```bash
   docker ps | grep mysql
   ```

2. Check MySQL logs:
   ```bash
   docker logs mysql
   ```

3. Verify the database was imported correctly:
   ```bash
   docker exec -it mysql mysql -uroot -p1234 -e "SHOW DATABASES;"
   ```

### Nginx Configuration

If you need to modify the Nginx configuration, edit the `nginx/default.conf` file and restart the Nginx container:

```bash
docker-compose restart nginx
```

## Security Considerations

For production deployment:

1. Use strong passwords for the database
2. Set up SSL certificates for HTTPS
3. Restrict access to PHPMyAdmin
4. Regularly update Docker images