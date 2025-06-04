#!/bin/bash

# Blue-Green Deployment Traffic Switching Script
# This script switches traffic from the current deployment to the new one

set -e

# Configuration
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_CONFIG_FILE="dao-portal"
BACKUP_DIR="/tmp/nginx-backups"
HEALTH_CHECK_TIMEOUT=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Function to check if services are healthy
check_health() {
    local frontend_port=$1
    local backend_port=$2
    local max_attempts=6
    local attempt=1

    log "Checking health of services on ports $frontend_port and $backend_port"

    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check frontend
        if curl -f --max-time 10 "http://localhost:$frontend_port/api/health" > /dev/null 2>&1; then
            frontend_healthy=true
        else
            frontend_healthy=false
        fi

        # Check backend
        if curl -f --max-time 10 "http://localhost:$backend_port/health" > /dev/null 2>&1; then
            backend_healthy=true
        else
            backend_healthy=false
        fi

        if [ "$frontend_healthy" = true ] && [ "$backend_healthy" = true ]; then
            log "All services are healthy"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            error "Health check failed after $max_attempts attempts"
            return 1
        fi

        sleep 10
        ((attempt++))
    done
}

# Function to backup current nginx configuration
backup_nginx_config() {
    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/nginx-config-$(date +%Y%m%d_%H%M%S).backup"
    
    if [ -f "$NGINX_CONFIG_DIR/$NGINX_CONFIG_FILE" ]; then
        cp "$NGINX_CONFIG_DIR/$NGINX_CONFIG_FILE" "$backup_file"
        log "Nginx configuration backed up to $backup_file"
    else
        warn "No existing nginx configuration found at $NGINX_CONFIG_DIR/$NGINX_CONFIG_FILE"
    fi
}

# Function to update nginx configuration for blue-green deployment
update_nginx_config() {
    local mode=$1  # "blue" or "green"
    
    if [ "$mode" = "blue" ]; then
        frontend_port=3000
        backend_port=8000
    else
        frontend_port=3001
        backend_port=8001
    fi

    log "Updating nginx configuration to point to $mode environment (frontend: $frontend_port, backend: $backend_port)"

    # Create new nginx configuration
    cat > "$NGINX_CONFIG_DIR/$NGINX_CONFIG_FILE" << EOF
upstream frontend_upstream {
    server localhost:$frontend_port max_fails=3 fail_timeout=30s;
}

upstream backend_upstream {
    server localhost:$backend_port max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name dao-portal.example.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;

    # Frontend routes
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend_upstream/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        proxy_pass http://frontend_upstream;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "STATIC";
    }
}

# HTTPS redirect (when SSL is configured)
# server {
#     listen 443 ssl http2;
#     server_name dao-portal.example.com;
#     
#     ssl_certificate /path/to/certificate.crt;
#     ssl_certificate_key /path/to/private.key;
#     
#     # Include SSL configuration
#     include /etc/nginx/ssl-params.conf;
#     
#     # Same location blocks as above
# }
EOF

    # Test nginx configuration
    if nginx -t; then
        log "Nginx configuration test passed"
    else
        error "Nginx configuration test failed"
        return 1
    fi
}

# Function to reload nginx
reload_nginx() {
    log "Reloading nginx configuration"
    if systemctl reload nginx; then
        log "Nginx reloaded successfully"
    else
        error "Failed to reload nginx"
        return 1
    fi
}

# Function to rollback nginx configuration
rollback_nginx() {
    local backup_file=$(ls -t "$BACKUP_DIR"/nginx-config-*.backup 2>/dev/null | head -n1)
    
    if [ -n "$backup_file" ]; then
        log "Rolling back nginx configuration from $backup_file"
        cp "$backup_file" "$NGINX_CONFIG_DIR/$NGINX_CONFIG_FILE"
        
        if nginx -t && systemctl reload nginx; then
            log "Nginx configuration rolled back successfully"
        else
            error "Failed to rollback nginx configuration"
            return 1
        fi
    else
        error "No backup configuration found for rollback"
        return 1
    fi
}

# Main deployment logic
main() {
    local target_env=${1:-"green"}  # Default to green deployment
    
    log "Starting blue-green deployment traffic switch to $target_env environment"
    
    # Backup current configuration
    backup_nginx_config
    
    # Determine ports based on target environment
    if [ "$target_env" = "green" ]; then
        new_frontend_port=3001
        new_backend_port=8001
    else
        new_frontend_port=3000
        new_backend_port=8000
    fi
    
    # Check if new services are healthy
    if ! check_health $new_frontend_port $new_backend_port; then
        error "New services are not healthy, aborting deployment"
        exit 1
    fi
    
    # Update nginx configuration
    if ! update_nginx_config "$target_env"; then
        error "Failed to update nginx configuration"
        exit 1
    fi
    
    # Reload nginx
    if ! reload_nginx; then
        error "Failed to reload nginx, attempting rollback"
        rollback_nginx
        exit 1
    fi
    
    # Wait for traffic to drain
    log "Waiting for traffic to drain from old services..."
    sleep 30
    
    # Final health check
    if ! check_health $new_frontend_port $new_backend_port; then
        error "Final health check failed, rolling back"
        rollback_nginx
        exit 1
    fi
    
    log "Traffic switch completed successfully!"
    log "Services are now running on:"
    log "  Frontend: localhost:$new_frontend_port"
    log "  Backend: localhost:$new_backend_port"
    
    # Clean up old backups (keep last 5)
    find "$BACKUP_DIR" -name "nginx-config-*.backup" -type f | sort -r | tail -n +6 | xargs rm -f
    
    log "Deployment completed successfully!"
}

# Script execution
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root or with sudo privileges"
        exit 1
    fi
    
    # Check if required tools are available
    for tool in curl nginx systemctl; do
        if ! command -v "$tool" &> /dev/null; then
            error "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    main "$@"
fi
