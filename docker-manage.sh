#!/bin/bash

# CRM System Docker Management Script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

show_help() {
    echo "CRM System Docker Management"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  logs      Show logs"
    echo "  status    Show service status"
    echo "  clean     Clean up and restart"
    echo "  backup    Create database backup"
    echo "  shell     Open shell in container"
    echo "  mysql     Open MySQL shell"
    echo "  help      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs nextjs"
    echo "  $0 shell nextjs"
}

case "$1" in
    "start")
        print_info "Starting CRM System..."
        docker-compose -f docker-compose.dev.yml up -d
        print_status "Services started"
        ;;
    
    "stop")
        print_info "Stopping CRM System..."
        docker-compose -f docker-compose.dev.yml down
        print_status "Services stopped"
        ;;
    
    "restart")
        print_info "Restarting CRM System..."
        docker-compose -f docker-compose.dev.yml restart
        print_status "Services restarted"
        ;;
    
    "logs")
        if [ -n "$2" ]; then
            docker-compose -f docker-compose.dev.yml logs -f "$2"
        else
            docker-compose -f docker-compose.dev.yml logs -f
        fi
        ;;
    
    "status")
        print_info "Service Status:"
        docker-compose -f docker-compose.dev.yml ps
        echo ""
        print_info "Health Checks:"
        echo "🌐 App: $(curl -s http://localhost:3000/api/health > /dev/null && echo "✅ OK" || echo "❌ Down")"
        echo "🗄️  phpMyAdmin: $(curl -s http://localhost:8080 > /dev/null && echo "✅ OK" || echo "❌ Down")"
        echo "🔧 MySQL: $(docker-compose -f docker-compose.dev.yml exec -T mysql mysqladmin ping -h localhost -uroot -p1234 --silent 2>/dev/null && echo "✅ OK" || echo "❌ Down")"
        ;;
    
    "clean")
        print_warning "This will remove all data. Continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker-compose -f docker-compose.dev.yml down -v
            docker system prune -f
            print_status "Cleanup completed"
            print_info "Run './docker-setup.sh' to restart"
        else
            print_info "Cancelled"
        fi
        ;;
    
    "backup")
        print_info "Creating database backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        backup_file="backup_${timestamp}.sql"
        
        docker-compose -f docker-compose.dev.yml exec -T mysql mysqldump -uroot -p1234 crm_system > "$backup_file"
        print_status "Backup created: $backup_file"
        ;;
    
    "shell")
        service=${2:-nextjs}
        print_info "Opening shell in $service container..."
        docker-compose -f docker-compose.dev.yml exec "$service" sh
        ;;
    
    "mysql")
        print_info "Opening MySQL shell..."
        docker-compose -f docker-compose.dev.yml exec mysql mysql -uroot -p1234 crm_system
        ;;
    
    "help"|"")
        show_help
        ;;
    
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac