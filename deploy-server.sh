#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 CRM System One-Click Deployment${NC}"
echo "=================================="

# Function to check if secrets file exists
check_secrets() {
    if [ ! -f "secrets.sh" ]; then
        echo -e "${YELLOW}📝 First time setup detected!${NC}"
        echo ""
        echo "Please create your secrets file:"
        echo "1. Copy secrets.example.sh to secrets.sh"
        echo "2. Edit secrets.sh with your actual values"
        echo ""
        echo -e "${BLUE}Commands:${NC}"
        echo "cp secrets.example.sh secrets.sh"
        echo "nano secrets.sh  # or use your preferred editor"
        echo ""
        echo "Then run this script again!"
        exit 1
    fi
}

# Function to load secrets
load_secrets() {
    echo -e "${BLUE}🔐 Loading secrets...${NC}"
    source ./secrets.sh
    
    if [ -z "$DATABASE_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$GOOGLE_CLIENT_ID" ]; then
        echo -e "${RED}❌ Some required secrets are missing!${NC}"
        echo "Please check your secrets.sh file"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Secrets loaded successfully${NC}"
}

# Function to setup environment
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment...${NC}"
    
    # Run the setup script
    ./setup-env.sh
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Environment setup completed${NC}"
    else
        echo -e "${RED}❌ Environment setup failed${NC}"
        exit 1
    fi
}

# Function to build and deploy with Docker
deploy_with_docker() {
    echo -e "${BLUE}🐳 Building and deploying with Docker...${NC}"
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose down 2>/dev/null || true
    
    # Clean up old images and containers
    echo "Cleaning up old Docker resources..."
    docker system prune -f 2>/dev/null || true
    
    # Export environment variables for docker-compose
    export DATABASE_PASSWORD
    export DATABASE_NAME
    export JWT_SECRET
    export NEXTAUTH_SECRET
    export NEXTAUTH_URL
    export EMAIL_USER
    export EMAIL_PASS
    export GOOGLE_CLIENT_ID
    export GOOGLE_CLIENT_SECRET
    export GOOGLE_REFRESH_TOKEN
    
    # Build and start containers
    echo "Building and starting containers..."
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker deployment completed${NC}"
        echo ""
        echo -e "${GREEN}🌐 Your CRM system should be available at: ${NEXTAUTH_URL}${NC}"
        echo -e "${GREEN}🔧 phpMyAdmin: ${NEXTAUTH_URL}/phpmyadmin${NC}"
        echo ""
        echo "Waiting for services to start..."
        sleep 10
    else
        echo -e "${RED}❌ Docker deployment failed${NC}"
        echo "Checking logs..."
        docker-compose logs --tail=50
        exit 1
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    echo "===================="
    docker-compose ps
    echo ""
    echo -e "${BLUE}📋 Recent Logs:${NC}"
    echo "==============="
    docker-compose logs --tail=20
}

# Function to install Docker if needed
install_docker() {
    echo -e "${YELLOW}🐳 Docker not found. Installing Docker...${NC}"
    
    # Detect OS
    if [ -f /etc/debian_version ]; then
        # Ubuntu/Debian
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker $USER
    else
        echo -e "${RED}❌ Unsupported OS. Please install Docker manually.${NC}"
        exit 1
    fi
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
    echo -e "${YELLOW}⚠️  Please logout and login again, then run this script again${NC}"
    exit 0
}

# Main deployment flow
main() {
    echo -e "${YELLOW}Choose deployment option:${NC}"
    echo "1. 🚀 One-click deployment (recommended)"
    echo "2. 📊 Show current status"
    echo "3. 🔄 Restart services"
    echo "4. 🛑 Stop services"
    echo "5. 📋 Show logs"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            check_secrets
            load_secrets
            setup_environment
            deploy_with_docker
            show_status
            ;;
        2)
            show_status
            ;;
        3)
            echo -e "${BLUE}🔄 Restarting services...${NC}"
            docker-compose restart
            show_status
            ;;
        4)
            echo -e "${BLUE}🛑 Stopping services...${NC}"
            docker-compose down
            echo -e "${GREEN}✅ Services stopped${NC}"
            ;;
        5)
            echo -e "${BLUE}📋 Showing logs...${NC}"
            docker-compose logs -f
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Please run the script again.${NC}"
            exit 1
            ;;
    esac
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    install_docker
fi

if ! command -v docker-compose &> /dev/null; then
    install_docker
fi

# Run main function
main

echo ""
echo -e "${GREEN}🎉 Operation completed!${NC}"
echo -e "${YELLOW}💡 Tip: Keep your secrets.sh file secure and never commit it to git!${NC}"