#!/bin/bash

# ===========================================
# 🚀 Production Setup Script
# ===========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header "🚀 CRM Production Setup"

# 1. Setup environment
echo "📋 Step 1: Setting up environment configuration..."
if [ -f "scripts/env-manager.sh" ]; then
    ./scripts/env-manager.sh setup production
    print_success "Environment configuration set up"
else
    print_error "env-manager.sh not found!"
    exit 1
fi

# 2. Copy production values
echo ""
echo "📋 Step 2: Applying production values..."
if [ -f ".env.production-real" ]; then
    cp .env.production-real .env
    print_success "Production values applied"
else
    print_warning "Using template values - you need to edit .env manually"
fi

# 3. Validate configuration
echo ""
echo "📋 Step 3: Validating configuration..."
./scripts/env-manager.sh validate

# 4. Show next steps
echo ""
print_header "✅ Setup Complete!"
echo ""
echo "🔧 Next steps:"
echo "   1. Edit .env file with your actual credentials:"
echo "      nano .env"
echo ""
echo "   2. Update these important values:"
echo "      - KAVENEGAR_API_KEY (get from https://panel.kavenegar.com)"
echo "      - COMPANY_PHONE (your actual phone number)"
echo "      - Any other custom settings"
echo ""
echo "   3. Deploy the application:"
echo "      ./deploy-secure.sh"
echo ""
echo "🔑 Google OAuth Setup:"
echo "   1. Go to: https://console.cloud.google.com"
echo "   2. Create OAuth 2.0 credentials"
echo "   3. Add redirect URI: https://ahmadreza-avandi.ir/api/auth/callback/google"
echo "   4. Get refresh token from: https://developers.google.com/oauthplayground"
echo ""
echo "📱 SMS Setup:"
echo "   1. Register at: https://kavenegar.com"
echo "   2. Get your API key from panel"
echo "   3. Update KAVENEGAR_API_KEY in .env"
echo ""
print_warning "Remember: Never commit .env file to git!"