#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Pushing changes to repository...${NC}"

# Add all changes
echo -e "${YELLOW}Adding changes...${NC}"
git add .

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Fix: Update database credentials and configure HTTPS"

# Push changes
echo -e "${YELLOW}Pushing to repository...${NC}"
git push

echo -e "${GREEN}✅ Changes pushed successfully!${NC}"