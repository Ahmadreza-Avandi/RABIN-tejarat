#!/bin/bash

# ===========================================
# 🛠️ CRM System Management Script
# ===========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "🛠️ CRM System Management Script"
    echo
    echo "Usage: ./manage.sh [COMMAND]"
    echo
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status"
    echo "  logs        Show logs (use -f for follow)"
    echo "  backup      Create database backup"
    echo "  restore     Restore database from backup"
    echo "  update      Update and rebuild services"
    echo "  ssl-renew   Renew SSL certificates"
    echo "  cleanup     Clean up unused Docker resources"
    echo "  monitor     Show system monitoring info"
    echo "  help        Show this help message"
    echo
}

start_services() {
    print_status "Starting CRM services..."
    docker-compose up -d
    print_success "Services started"
}

stop_services() {
    print_status "Stopping CRM services..."
    docker-compose down
    print_success "Services stopped"
}

restart_services() {
    print_status "Restarting CRM services..."
    docker-compose restart
    print_success "Services restarted"
}

show_status() {
    print_status "Service Status:"
    docker-compose ps
    echo
    print_status "System Resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

show_logs() {
    if [ "$2" = "-f" ]; then
        docker-compose logs -f
    else
        docker-compose logs --tail=50
    fi
}

backup_database() {
    print_status "Creating database backup..."
    BACKUP_FILE="backups/crm_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker-compose exec -T mysql mysqldump -u root -p1234 crm_system > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Database backup created: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        print_success "Backup compressed: ${BACKUP_FILE}.gz"
        
        # Clean old backups (keep last 10)
        ls -t backups/crm_backup_*.sql.gz | tail -n +11 | xargs -r rm
        print_status "Old backups cleaned up"
    else
        print_error "Database backup failed"
    fi
}

restore_database() {
    echo "Available backups:"
    ls -la backups/crm_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    echo
    read -p "Enter backup file name (without path): " backup_file
    
    if [ -f "backups/$backup_file" ]; then
        print_warning "This will overwrite the current database. Are you sure? (y/N)"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Restoring database from $backup_file..."
            
            if [[ $backup_file == *.gz ]]; then
                gunzip -c "backups/$backup_file" | docker-compose exec -T mysql mysql -u root -p1234 crm_system
            else
                docker-compose exec -T mysql mysql -u root -p1234 crm_system < "backups/$backup_file"
            fi
            
            if [ $? -eq 0 ]; then
                print_success "Database restored successfully"
            else
                print_error "Database restore failed"
            fi
        fi
    else
        print_error "Backup file not found: backups/$backup_file"
    fi
}

update_services() {
    print_status "Updating services..."
    
    # Pull latest images
    docker-compose pull
    
    # Rebuild and restart
    docker-compose up -d --build
    
    # Clean up old images
    docker image prune -f
    
    print_success "Services updated"
}

renew_ssl() {
    print_status "Renewing SSL certificates..."
    docker-compose run --rm certbot renew
    docker-compose restart nginx
    print_success "SSL certificates renewed"
}

cleanup_docker() {
    print_status "Cleaning up Docker resources..."
    docker system prune -f
    docker volume prune -f
    print_success "Docker cleanup completed"
}

monitor_system() {
    print_status "System Monitoring Information:"
    echo
    echo "📊 Docker Container Stats:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo
    echo "💾 Disk Usage:"
    df -h
    echo
    echo "🧠 Memory Usage:"
    free -h
    echo
    echo "⚡ System Load:"
    uptime
    echo
    echo "🌐 Network Connections:"
    netstat -tuln | grep -E ':80|:443|:3000|:3306'
    echo
    echo "📋 Service Health:"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || echo "Health check failed"
}

# Main script logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database
        ;;
    update)
        update_services
        ;;
    ssl-renew)
        renew_ssl
        ;;
    cleanup)
        cleanup_docker
        ;;
    monitor)
        monitor_system
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac