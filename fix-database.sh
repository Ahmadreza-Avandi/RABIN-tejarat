#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Fixing database connection...${NC}"

# Create SQL script to fix database user
cat > fix-db-user.sql << EOF
-- Create user if not exists
CREATE USER IF NOT EXISTS 'crm_user'@'%' IDENTIFIED BY '1234';

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON crm_system.* TO 'crm_user'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show users to verify
SELECT User, Host FROM mysql.user;
EOF

# Execute SQL script in MySQL container
echo -e "${YELLOW}Creating/fixing database user...${NC}"
docker exec -i crm-mysql mysql -uroot -p1234 < fix-db-user.sql

# Remove temporary SQL file
rm fix-db-user.sql

echo -e "${GREEN}✅ Database user fixed!${NC}"