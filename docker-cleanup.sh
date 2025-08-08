#!/bin/bash

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Docker cleanup process...${NC}"

# Stop all running containers
echo -e "${YELLOW}Stopping all running containers...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || echo -e "${RED}No containers to stop${NC}"

# Remove all containers
echo -e "${YELLOW}Removing all containers...${NC}"
docker rm $(docker ps -aq) 2>/dev/null || echo -e "${RED}No containers to remove${NC}"

# Remove all volumes
echo -e "${YELLOW}Removing all volumes...${NC}"
docker volume rm $(docker volume ls -q) 2>/dev/null || echo -e "${RED}No volumes to remove${NC}"

# Remove all networks
echo -e "${YELLOW}Removing all networks...${NC}"
docker network rm $(docker network ls -q) 2>/dev/null || echo -e "${RED}No networks to remove${NC}"

# Remove dangling images
echo -e "${YELLOW}Removing dangling images...${NC}"
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || echo -e "${RED}No dangling images to remove${NC}"

# System prune
echo -e "${YELLOW}Performing system prune...${NC}"
docker system prune -f

# Ask if user wants to remove all images
read -p "Do you want to remove all Docker images? (y/n): " remove_images
if [[ $remove_images == "y" || $remove_images == "Y" ]]; then
    echo -e "${YELLOW}Removing all Docker images...${NC}"
    docker rmi $(docker images -q) 2>/dev/null || echo -e "${RED}No images to remove${NC}"
fi

echo -e "${GREEN}Docker cleanup completed!${NC}"
echo -e "${GREEN}You can now start your containers with 'docker-compose up -d'${NC}"