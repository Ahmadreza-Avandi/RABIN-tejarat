# RABIN-tejarat CRM System

A comprehensive Customer Relationship Management (CRM) system with Customer Experience Management (CEM) capabilities, built with Next.js, MySQL, and Docker.

## Features

- User authentication and authorization
- Customer management
- Sales pipeline tracking
- Email integration with Gmail API
- Chat functionality
- Customer feedback collection
- Voice analysis
- Reporting and analytics
- Task management
- Responsive design

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx
- **Authentication**: JWT

## Local Development

### Prerequisites

- Docker and Docker Compose
- Node.js (for development outside Docker)
- Git

### Running with Docker

1. Clone the repository:
   ```
   git clone https://github.com/Ahmadreza-Avandi/RABIN-tejarat.git
   cd RABIN-tejarat
   ```

2. Start the Docker containers:
   ```
   docker-compose up -d
   ```

3. Access the application at http://localhost:3000

## Environment Configuration

The application uses environment variables for configuration. Copy the example environment file and update it with your settings:

```
cp .env.example .env.local
```

## License

This project is proprietary and confidential.