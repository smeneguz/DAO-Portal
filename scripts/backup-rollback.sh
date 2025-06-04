#!/bin/bash

# Backup and Rollback Script for DAO Portal
# This script creates backups and handles rollbacks for the application

set -e

# Configuration
DEPLOY_PATH="/home/deploy/dao-portal"
BACKUP_PATH="$DEPLOY_PATH/backups"
MAX_BACKUPS=10
DATE_FORMAT=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Function to create database backup
backup_database() {
    local backup_name="database_backup_$DATE_FORMAT.sql"
    local backup_file="$BACKUP_PATH/$backup_name"
    
    log "Creating database backup: $backup_name"
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_PATH"
    
    # Get database credentials from environment
    source "$DEPLOY_PATH/production/.env"
    
    # Create database backup
    docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" exec -T postgres \
        pg_dump -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Database backup created successfully: $backup_file"
        
        # Compress the backup
        gzip "$backup_file"
        log "Database backup compressed: ${backup_file}.gz"
        
        return 0
    else
        error "Failed to create database backup"
        return 1
    fi
}

# Function to create application backup
backup_application() {
    local backup_name="app_backup_$DATE_FORMAT.tar.gz"
    local backup_file="$BACKUP_PATH/$backup_name"
    
    log "Creating application backup: $backup_name"
    
    # Ensure backup directory exists
    mkdir -p "$BACKUP_PATH"
    
    # Create application backup (excluding node_modules, .git, logs, etc.)
    tar -czf "$backup_file" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='__pycache__' \
        --exclude='.pytest_cache' \
        --exclude='logs' \
        --exclude='backups' \
        -C "$DEPLOY_PATH/production" .
    
    if [ $? -eq 0 ]; then
        log "Application backup created successfully: $backup_file"
        return 0
    else
        error "Failed to create application backup"
        return 1
    fi
}

# Function to create Docker images backup
backup_docker_images() {
    local backup_name="docker_images_$DATE_FORMAT.tar"
    local backup_file="$BACKUP_PATH/$backup_name"
    
    log "Creating Docker images backup: $backup_name"
    
    # Get current image tags
    local frontend_image=$(docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" images --format json | jq -r '.Repository + ":" + .Tag' | grep frontend)
    local backend_image=$(docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" images --format json | jq -r '.Repository + ":" + .Tag' | grep backend) 
    
    # Save Docker images
    docker save -o "$backup_file" "$frontend_image" "$backend_image"
    
    if [ $? -eq 0 ]; then
        # Compress the backup
        gzip "$backup_file"
        log "Docker images backup created successfully: ${backup_file}.gz"
        return 0
    else
        error "Failed to create Docker images backup"
        return 1
    fi
}

# Function to restore database from backup
restore_database() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Restoring database from backup: $backup_file"
    
    # Get database credentials
    source "$DEPLOY_PATH/production/.env"
    
    # Decompress if needed
    if [[ "$backup_file" == *.gz ]]; then
        local temp_file="/tmp/db_restore_$DATE_FORMAT.sql"
        gunzip -c "$backup_file" > "$temp_file"
        backup_file="$temp_file"
    fi
    
    # Stop application to prevent connections
    docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" stop backend frontend
    
    # Restore database
    docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" exec -T postgres \
        psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$backup_file"
    
    if [ $? -eq 0 ]; then
        log "Database restored successfully"
        
        # Restart application
        docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" up -d
        
        # Clean up temp file if created
        [ -f "/tmp/db_restore_$DATE_FORMAT.sql" ] && rm -f "/tmp/db_restore_$DATE_FORMAT.sql"
        
        return 0
    else
        error "Failed to restore database"
        return 1
    fi
}

# Function to rollback to previous deployment
rollback_deployment() {
    local steps_back=${1:-1}
    
    log "Rolling back deployment ($steps_back steps back)"
    
    # Create current state backup before rollback
    log "Creating backup before rollback..."
    backup_database
    backup_application
    
    # Get previous Docker image tags (this would need to be implemented based on your tagging strategy)
    # For now, we'll assume you have a rollback mechanism in place
    
    log "Stopping current services..."
    docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" down
    
    # Here you would implement the logic to:
    # 1. Pull previous image versions
    # 2. Update docker-compose.yml with previous tags
    # 3. Start services with previous versions
    
    warn "Rollback functionality needs to be implemented based on your specific image tagging strategy"
    
    # For now, just restart current services
    log "Restarting services..."
    docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" up -d
    
    # Health check
    sleep 30
    if curl -f http://localhost:3000/health && curl -f http://localhost:8000/health; then
        log "Rollback completed successfully"
        return 0
    else
        error "Rollback failed - services are not healthy"
        return 1
    fi
}

# Function to clean up old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only the most recent backups
    for pattern in "database_backup_*.sql.gz" "app_backup_*.tar.gz" "docker_images_*.tar.gz"; do
        find "$BACKUP_PATH" -name "$pattern" -type f | sort -r | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    done
    
    log "Backup cleanup completed"
}

# Function to list available backups
list_backups() {
    log "Available backups:"
    
    echo "Database backups:"
    ls -la "$BACKUP_PATH"/database_backup_*.sql.gz 2>/dev/null | tail -5
    
    echo -e "\nApplication backups:"
    ls -la "$BACKUP_PATH"/app_backup_*.tar.gz 2>/dev/null | tail -5
    
    echo -e "\nDocker image backups:"
    ls -la "$BACKUP_PATH"/docker_images_*.tar.gz 2>/dev/null | tail -5
}

# Function to verify backup integrity
verify_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    log "Verifying backup integrity: $backup_file"
    
    case "$backup_file" in
        *.sql.gz)
            # Verify SQL backup can be decompressed and has content
            if gunzip -t "$backup_file" && [ $(gunzip -c "$backup_file" | wc -l) -gt 0 ]; then
                log "Database backup is valid"
                return 0
            else
                error "Database backup is corrupted"
                return 1
            fi
            ;;
        *.tar.gz)
            # Verify tar backup
            if tar -tzf "$backup_file" > /dev/null; then
                log "Archive backup is valid"
                return 0
            else
                error "Archive backup is corrupted"
                return 1
            fi
            ;;
        *)
            warn "Unknown backup file type: $backup_file"
            return 1
            ;;
    esac
}

# Main function
main() {
    local command=${1:-"help"}
    
    case "$command" in
        "backup")
            log "Starting full backup process..."
            backup_database
            backup_application
            backup_docker_images
            cleanup_backups
            log "Backup process completed"
            ;;
        "backup-db")
            backup_database
            cleanup_backups
            ;;
        "backup-app")
            backup_application
            cleanup_backups
            ;;
        "restore-db")
            if [ -z "$2" ]; then
                error "Please specify backup file to restore from"
                list_backups
                exit 1
            fi
            restore_database "$2"
            ;;
        "rollback")
            rollback_deployment "$2"
            ;;
        "list")
            list_backups
            ;;
        "verify")
            if [ -z "$2" ]; then
                error "Please specify backup file to verify"
                exit 1
            fi
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_backups
            ;;
        "help")
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  backup          - Create full backup (database + application + docker images)"
            echo "  backup-db       - Create database backup only"
            echo "  backup-app      - Create application backup only"
            echo "  restore-db FILE - Restore database from backup file"
            echo "  rollback [N]    - Rollback deployment (N steps back, default 1)"
            echo "  list            - List available backups"
            echo "  verify FILE     - Verify backup file integrity"
            echo "  cleanup         - Clean up old backups"
            echo "  help            - Show this help message"
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Check if running as deploy user
if [ "$USER" != "deploy" ] && [ "$EUID" -ne 0 ]; then
    warn "This script should be run as the deploy user or root"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_PATH"

# Run main function
main "$@"
