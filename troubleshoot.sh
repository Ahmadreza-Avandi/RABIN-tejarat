#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Troubleshooting CRM System...${NC}"

# Check if Docker is running
echo -e "${YELLOW}Checking if Docker is running...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Docker is running.${NC}"
fi

# Check if containers are running
echo -e "${YELLOW}Checking container status...${NC}"
docker ps -a

# Check Nginx logs
echo -e "${YELLOW}Checking Nginx logs...${NC}"
docker logs crm-nginx 2>&1 | tail -n 20

# Check NextJS logs
echo -e "${YELLOW}Checking NextJS logs...${NC}"
docker logs crm-nextjs 2>&1 | tail -n 20

# Check MySQL logs
echo -e "${YELLOW}Checking MySQL logs...${NC}"
docker logs crm-mysql 2>&1 | tail -n 20

# Check if SSL certificates exist
echo -e "${YELLOW}Checking SSL certificates...${NC}"
docker exec crm-nginx ls -la /etc/letsencrypt/live/ahmadreza-avandi.ir/ 2>/dev/null || echo -e "${RED}❌ SSL certificates not found.${NC}"

# Check DNS resolution
echo -e "${YELLOW}Checking DNS resolution...${NC}"
host ahmadreza-avandi.ir || echo -e "${RED}❌ DNS resolution failed.${NC}"

# Check if ports are open
echo -e "${YELLOW}Checking if ports are open...${NC}"
docker exec crm-nginx netstat -tulpn | grep -E '80|443' || echo -e "${RED}❌ Ports 80/443 are not open.${NC}"

# Check Nginx configuration
echo -e "${YELLOW}Checking Nginx configuration...${NC}"
docker exec crm-nginx nginx -t 2>&1 || echo -e "${RED}❌ Nginx configuration test failed.${NC}"

echo -e "${YELLOW}Troubleshooting complete. Please check the output above for any issues.${NC}"
echo -e "${YELLOW}If SSL certificates are missing, you may need to run:${NC}"
echo -e "${GREEN}docker-compose run --rm certbot${NC}"