# Local Development Guide for CEM-CRM

This guide provides instructions for setting up the CEM-CRM application for local development using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned to your local machine

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
cd RABIN-tejarat
```

### 2. Clean Docker Environment (Optional)

If you want to start with a clean Docker environment, run:

```bash
# Make the cleanup script executable
chmod +x docker-cleanup.sh

# Run the cleanup script
./docker-cleanup.sh
```

### 3. Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Edit the `.env.local` file with your development settings:

```bash
# Use your favorite text editor
nano .env.local
```

Important variables to update:
- `DATABASE_PASSWORD`: Password for the MySQL database (default: 1234)
- `DATABASE_NAME`: Database name (default: crm_system)
- Email configuration (if you want to test email functionality)
- Google OAuth settings (if using Gmail)

### 4. Start the Development Environment

```bash
docker-compose up -d
```

This will:
- Start a MySQL database container with the CRM database
- Build and start the Next.js application
- Set up Nginx as a reverse proxy
- Start PHPMyAdmin for database management

### 5. Access the Application

- Next.js application: http://localhost:3000
- Nginx proxy: http://localhost:8000
- PHPMyAdmin: http://localhost:8080 (username: root, password: 1234)

## Development Workflow

### Viewing Logs

To view logs for any container:

```bash
docker-compose logs -f [service-name]
```

Where `[service-name]` can be `nextjs`, `mysql`, `nginx-proxy`, or `phpmyadmin`.

### Restarting Services

If you make changes to the Docker configuration, you may need to restart the services:

```bash
docker-compose restart
```

Or to restart a specific service:

```bash
docker-compose restart [service-name]
```

### Stopping the Environment

To stop all containers:

```bash
docker-compose down
```

## Database Management

### Accessing the Database

You can access the database through PHPMyAdmin at http://localhost:8080 or directly using the MySQL command line:

```bash
docker exec -it mysql mysql -uroot -p1234 crm_system
```

### Importing Data

The database is automatically imported from the `crm_system.sql` file in the root directory when the MySQL container starts for the first time.

If you need to reimport the database:

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
   docker exec mysql mysql -uroot -p1234 -e "SHOW DATABASES;"
   ```

### Port Conflicts

If you encounter port conflicts (e.g., "address already in use"), you may have other services running on those ports. You can modify the port mappings in the `docker-compose.yml` file to use different ports.