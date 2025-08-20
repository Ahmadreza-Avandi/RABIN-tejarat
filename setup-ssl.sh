#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 Setting up SSL certificates for ahmadreza-avandi.ir...${NC}"

# Stop Nginx to free up port 80 for certbot
echo -e "${YELLOW}Stopping Nginx to free up port 80...${NC}"
docker-compose stop nginx

# Run certbot to obtain certificates
echo -e "${YELLOW}Running certbot to obtain SSL certificates...${NC}"
docker-compose run --rm certbot certonly --standalone \
  --preferred-challenges http \
  --email admin@ahmadreza-avandi.ir \
  --agree-tos \
  --no-eff-email \
  -d ahmadreza-avandi.ir \
  -d www.ahmadreza-avandi.ir

# Check if certificates were obtained successfully
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ SSL certificates obtained successfully.${NC}"
else
  echo -e "${RED}❌ Failed to obtain SSL certificates. Please check the error messages above.${NC}"
  echo -e "${YELLOW}Restarting Nginx...${NC}"
  docker-compose start nginx
  exit 1
fi

# Restart Nginx to apply the new certificates
echo -e "${YELLOW}Restarting Nginx with SSL configuration...${NC}"
docker-compose start nginx

# Check Nginx status
echo -e "${YELLOW}Checking Nginx status...${NC}"
docker-compose ps nginx

echo -e "${GREEN}🎉 SSL setup complete!${NC}"
echo -e "${GREEN}🌐 Website should now be accessible at: https://ahmadreza-avandi.ir${NC}"
echo -e "${GREEN}🔐 phpMyAdmin: https://ahmadreza-avandi.ir/secure-db-admin-panel-x7k9m2/${NC}"

# Add cron job for certificate renewal (if not already added)
echo -e "${YELLOW}Setting up automatic certificate renewal...${NC}"
(crontab -l 2>/dev/null || echo "") | grep -q "certbot renew" || (
  (crontab -l 2>/dev/null; echo "0 3 * * * docker-compose -f /home/ahmad/Documents/CEM-CRM-main/docker-compose.yml run --rm certbot renew --quiet && docker-compose -f /home/ahmad/Documents/CEM-CRM-main/docker-compose.yml restart nginx") | crontab -
  echo -e "${GREEN}✅ Added automatic certificate renewal cron job.${NC}"
)