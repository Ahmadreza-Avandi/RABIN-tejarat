# Server Deployment Guide for CEM-CRM

This is a simplified guide for deploying the CEM-CRM system on your server.

## Quick Deployment Steps

1. **Clone the repository on your server**
   ```bash
   git clone https://github.com/your-username/CEM-CRM-main.git
   cd CEM-CRM-main
   ```

2. **Configure environment variables**
   ```bash
   # Edit the production environment file with your server settings
   nano .env.production
   ```
   
   Make sure to update:
   - Database credentials
   - JWT and NextAuth secrets
   - Email configuration
   - Set NEXTAUTH_URL to your server domain or IP

3. **Build and start the Docker containers**
   ```bash
   docker compose up -d --build
   ```

4. **Access the application**
   - Main application: http://your-server-ip
   - phpMyAdmin: http://your-server-ip/phpmyadmin

## Troubleshooting

If you encounter the error about `rclone.conf` not found, it's safe to ignore as we've removed the backup service that was causing this issue.

If you have issues with Alpine package repositories, the Dockerfile has been updated to use reliable mirrors.

For more detailed deployment instructions, see the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).