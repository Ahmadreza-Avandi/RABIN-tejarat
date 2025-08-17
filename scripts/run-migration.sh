#!/bin/bash

# ===========================================
# 🔄 Database Migration Runner
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    print_error "❌ .env file not found!"
    exit 1
fi

# Database connection parameters
DB_HOST=${DATABASE_HOST:-localhost}
DB_USER=${DATABASE_USER:-root}
DB_PASS=${DATABASE_PASSWORD:-1234}
DB_NAME=${DATABASE_NAME:-crm_system}

print_header "🔄 Running Database Migrations"

print_status "📊 Database: $DB_NAME"
print_status "🖥️  Host: $DB_HOST"
print_status "👤 User: $DB_USER"

# Check if mysql command is available
if ! command -v mysql &> /dev/null; then
    print_error "❌ MySQL client not found! Please install mysql-client"
    exit 1
fi

# Test database connection
print_status "🔍 Testing database connection..."
if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null; then
    print_status "✅ Database connection successful"
else
    print_error "❌ Cannot connect to database"
    exit 1
fi

# Run migration
MIGRATION_FILE="database/migrations/001_make_deal_id_nullable.sql"

if [ -f "$MIGRATION_FILE" ]; then
    print_status "🚀 Running migration: $MIGRATION_FILE"
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" < "$MIGRATION_FILE"; then
        print_status "✅ Migration completed successfully"
        
        # Verify the change
        print_status "🔍 Verifying migration..."
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; DESCRIBE sales;" | grep deal_id
        
        print_status "🎉 Migration verification complete"
    else
        print_error "❌ Migration failed"
        exit 1
    fi
else
    print_error "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

print_header "✅ Migration Complete"
print_status "The sales table now allows NULL values for deal_id"
print_status "You can now create sales without requiring a deal"