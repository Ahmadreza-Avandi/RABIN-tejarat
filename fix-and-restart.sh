#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Applying all fixes and restarting services...${NC}"

# 1. Fix database user
echo -e "${YELLOW}Step 1: Fixing database user...${NC}"
./fix-database.sh

# 2. Push changes to repository
echo -e "${YELLOW}Step 2: Pushing changes to repository...${NC}"
./push-changes.sh

# 3. Set up SSL certificates if needed
echo -e "${YELLOW}Step 3: Checking SSL certificates...${NC}"
docker exec crm-nginx ls -la /etc/letsencrypt/live/ahmadreza-avandi.ir/ &>/dev/null
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}SSL certificates not found. Setting up SSL...${NC}"
  ./setup-ssl.sh
else
  echo -e "${GREEN}✅ SSL certificates already exist.${NC}"
fi

# 4. Restart services
echo -e "${YELLOW}Step 4: Restarting services...${NC}"
./restart-services.sh

# 5. Final check
echo -e "${YELLOW}Step 5: Running final checks...${NC}"
./troubleshoot.sh

echo -e "${GREEN}🎉 All fixes applied and services restarted!${NC}"
echo -e "${GREEN}🌐 Website: https://ahmadreza-avandi.ir${NC}"
echo -e "${GREEN}🔐 phpMyAdmin: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/${NC}"
echo -e "${GREEN}🗄️ Database Login:${NC}"
echo -e "${GREEN}   • Username: crm_user${NC}"
echo -e "${GREEN}   • Password: 1234${NC}"