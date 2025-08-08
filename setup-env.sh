#!/bin/bash

echo "🔧 Setting up environment configuration..."

# Check if environment variables are set
if [ -z "$DATABASE_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ Required environment variables are not set!"
    echo "Please set the following environment variables:"
    echo "  - DATABASE_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - NEXTAUTH_SECRET"
    echo "  - EMAIL_PASS"
    echo "  - GOOGLE_CLIENT_ID"
    echo "  - GOOGLE_CLIENT_SECRET"
    echo "  - GOOGLE_REFRESH_TOKEN"
    echo ""
    echo "Example:"
    echo "export DATABASE_PASSWORD='your_db_password'"
    echo "export JWT_SECRET='your_jwt_secret'"
    echo "# ... and so on"
    exit 1
fi

# Create .env.production file with production settings
cat > .env.production << EOF
# Database Configuration
DATABASE_URL=mysql://root:${DATABASE_PASSWORD}@mysql:3306/crm_system
DATABASE_HOST=mysql
DATABASE_USER=root
DATABASE_PASSWORD=${DATABASE_PASSWORD}
DATABASE_NAME=crm_system

# JWT Secret
JWT_SECRET=${JWT_SECRET}

# Next.js Configuration
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${NEXTAUTH_URL:-https://ahmadreza-avandi.ir}

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=${EMAIL_USER:-ahmadrezaavandi@gmail.com}
EMAIL_PASS=${EMAIL_PASS}

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REFRESH_TOKEN=${GOOGLE_REFRESH_TOKEN}

# Alternative email providers (uncomment to use)
# EMAIL_HOST=smtp-mail.outlook.com  # For Outlook/Hotmail
# EMAIL_HOST=smtp.mail.yahoo.com    # For Yahoo
EOF

echo "✅ Environment file created successfully!"

# Make sure the file has correct permissions
chmod 600 .env.production

echo "🔒 File permissions set to 600 (owner read/write only)"
echo "📁 .env.production file is ready for production deployment"