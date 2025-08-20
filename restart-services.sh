#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Restarting CRM services...${NC}"

# Test Nginx configuration
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
docker-compose run --rm nginx nginx -t

# Stop the containers
echo -e "${YELLOW}Stopping containers...${NC}"
docker-compose down

# Start the containers
echo -e "${YELLOW}Starting containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}📊 Checking status...${NC}"
docker ps --format "NAME\t\tIMAGE\t\tCOMMAND\t\tSERVICE\t\tCREATED\t\tSTATUS\t\tPORTS"

echo -e "${GREEN}✅ Services restarted!${NC}"
echo -e "${GREEN}🌐 Website: https://ahmadreza-avandi.ir${NC}"
echo -e "${GREEN}🔐 phpMyAdmin: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/${NC}"
echo -e "${GREEN}🗄️ Database Login:${NC}"
echo -e "${GREEN}   • Username: crm_user${NC}"
echo -e "${GREEN}   • Password: 1234${NC}"