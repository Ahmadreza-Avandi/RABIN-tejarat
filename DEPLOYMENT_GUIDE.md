# CEM-CRM Deployment Guide

This guide provides instructions for deploying the CEM-CRM system on a server using Docker.

## Prerequisites

- Docker and Docker Compose installed on the server
- Git installed on the server
- A domain name (optional, for production use)

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/CEM-CRM-main.git
cd CEM-CRM-main
```

### 2. Configure Environment Variables

Copy the template environment file and update it with your settings:

```bash
cp .env.template .env.production
```

Edit the `.env.production` file and update the following variables:

- `DATABASE_PASSWORD`: Set a secure password for the MySQL database
- `DATABASE_NAME`: Set the database name (default: crm_system)
- `JWT_SECRET`: Set a secure random string for JWT authentication
- `NEXTAUTH_SECRET`: Set a secure random string for NextAuth
- `NEXTAUTH_URL`: Set to your domain name or server IP (e.g., http://your-domain.com or http://server-ip)
- `EMAIL_USER`: Your email address for sending emails
- `EMAIL_PASS`: Your email app password
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: Your Google OAuth credentials (if using Gmail)

### 3. Build and Start the Docker Containers

```bash
docker compose up -d --build
```

This command will:
- Build the Next.js application
- Start the MySQL database
- Start the Nginx web server
- Start phpMyAdmin for database management

### 4. Initialize the Database

The database will be automatically initialized with the schema from `crm_system.sql`. If you need to manually initialize or restore the database, you can use:

```bash
docker exec -i mysql mysql -uroot -p<your-password> crm_system < crm_system.sql
```

### 5. Access the Application

- Main application: http://your-domain.com or http://server-ip
- phpMyAdmin: http://your-domain.com/phpmyadmin or http://server-ip/phpmyadmin

### 6. SSL Configuration (Optional)

For production use, it's recommended to configure SSL. The Nginx container is already set up to use Let's Encrypt certificates.

1. Install Certbot on your server
2. Obtain SSL certificates:

```bash
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

3. The certificates will be automatically mounted to the Nginx container.

## Maintenance

### Updating the Application

To update the application with the latest changes:

```bash
git pull
docker compose up -d --build
```

### Backup and Restore

Database backups are stored in the `mysql_data` volume. You can create a backup with:

```bash
docker exec mysql mysqldump -uroot -p<your-password> crm_system > backup.sql
```

To restore from a backup:

```bash
docker exec -i mysql mysql -uroot -p<your-password> crm_system < backup.sql
```

### Logs

To view logs for any container:

```bash
docker compose logs -f [service-name]
```

Where `[service-name]` can be `nextjs`, `mysql`, `nginx`, or `phpmyadmin`.

## Troubleshooting

### Database Connection Issues

If the application cannot connect to the database:

1. Check if the MySQL container is running:
   ```bash
   docker compose ps
   ```

2. Verify the database credentials in `.env.production`

3. Check the MySQL logs:
   ```bash
   docker compose logs mysql
   ```

### Application Errors

If the Next.js application is not working:

1. Check the application logs:
   ```bash
   docker compose logs nextjs
   ```

2. Verify that all environment variables are correctly set in `.env.production`

3. Rebuild the application:
   ```bash
   docker compose up -d --build nextjs
   ```

## Security Considerations

- Change default database passwords in production
- Use strong, unique passwords for all services
- Keep Docker and all containers updated
- Configure a firewall to restrict access to necessary ports only
- Use SSL for all production deployments