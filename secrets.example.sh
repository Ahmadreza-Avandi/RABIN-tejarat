#!/bin/bash

# 🔐 Server Secrets Configuration
# Copy this file to 'secrets.sh' and fill in your actual values
# NEVER commit secrets.sh to git!

# Database Configuration
export DATABASE_PASSWORD="1234"  # Change this to a strong password
export DATABASE_NAME="crm_system"

# JWT Configuration (Generate random strings at least 32 characters)
export JWT_SECRET="your_very_long_and_random_jwt_secret_here_at_least_32_characters_long"
export NEXTAUTH_SECRET="your_nextauth_secret_here_also_long_and_random_at_least_32_chars"

# Domain Configuration
export NEXTAUTH_URL="https://your-domain.com"  # Your actual domain or IP

# Email Configuration
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your_gmail_app_password_here"  # Gmail App Password (not regular password)

# Google OAuth 2.0 Configuration
export GOOGLE_CLIENT_ID="your_google_client_id_here.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-your_google_client_secret_here"
export GOOGLE_REFRESH_TOKEN="1//your_google_refresh_token_here"

# Success message
echo "✅ Secrets loaded successfully!"
echo "🌐 Domain: $NEXTAUTH_URL"
echo "📧 Email: $EMAIL_USER"
echo "🗄️  Database: $DATABASE_NAME"

# Tips for generating secrets
echo ""
echo "💡 Tips:"
echo "   - Generate JWT secrets: openssl rand -base64 32"
echo "   - Use strong database password"
echo "   - Get Gmail App Password from Google Account settings"
echo "   - Setup Google OAuth in Google Cloud Console"