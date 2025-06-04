#!/bin/bash

# Server Setup and Deployment Script for DAO Portal
# This script sets up the production environment and handles deployments

set -e

# Configuration
PROJECT_NAME="dao-portal"
DEPLOY_USER="deploy"
DEPLOY_PATH="/home/deploy/dao-portal"
NGINX_CONFIG_PATH="/etc/nginx/sites-available/dao-portal"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/dao-portal"
DOCKER_COMPOSE_VERSION="2.21.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root for initial setup"
        exit 1
    fi
}

# Function to install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install required packages
    apt-get install -y \
        curl \
        wget \
        git \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    log "System dependencies installed successfully"
}

# Function to install Docker
install_docker() {
    log "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add deploy user to docker group
    usermod -aG docker $DEPLOY_USER
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    log "Docker installed successfully"
}

# Function to create deploy user
create_deploy_user() {
    log "Creating deploy user..."
    
    # Create user if it doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$DEPLOY_USER"
        log "Deploy user created: $DEPLOY_USER"
    else
        log "Deploy user already exists: $DEPLOY_USER"
    fi
    
    # Create .ssh directory and set permissions
    mkdir -p "/home/$DEPLOY_USER/.ssh"
    chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
    chmod 700 "/home/$DEPLOY_USER/.ssh"
    
    # Add deploy user to sudo group (for specific commands)
    usermod -aG sudo "$DEPLOY_USER"
    
    # Create sudoers rule for deploy user (specific commands only)
    cat > "/etc/sudoers.d/$DEPLOY_USER" << EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /usr/sbin/nginx
EOF
    
    log "Deploy user configured successfully"
}

# Function to setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful with this)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow specific ports for applications (if needed)
    # ufw allow 8000/tcp  # Backend API (if directly exposed)
    # ufw allow 3000/tcp  # Frontend (if directly exposed)
    
    # Enable UFW
    ufw --force enable
    
    log "Firewall configured successfully"
}

# Function to configure fail2ban
setup_fail2ban() {
    log "Setting up fail2ban..."
    
    # Create nginx-specific jail
    cat > "/etc/fail2ban/jail.d/nginx.conf" << EOF
[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600
findtime = 600
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log "Fail2ban configured successfully"
}

# Function to setup project directories
setup_project_directories() {
    log "Setting up project directories..."
    
    # Create main project directory
    mkdir -p "$DEPLOY_PATH"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"
    
    # Create subdirectories
    sudo -u "$DEPLOY_USER" mkdir -p "$DEPLOY_PATH"/{production,staging,backups,logs,scripts}
    
    # Create scripts directory and make it executable
    chmod +x "$DEPLOY_PATH/scripts"
    
    log "Project directories created successfully"
}

# Function to setup environment files
setup_environment_files() {
    log "Setting up environment files..."
    
    # Production environment template
    cat > "$DEPLOY_PATH/production/.env.production.template" << EOF
# Production Environment Configuration
ENVIRONMENT=production

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=dao_portal_prod
POSTGRES_USER=dao_user
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://\${REDIS_HOST}:\${REDIS_PORT}

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
SECRET_KEY=CHANGE_ME_VERY_LONG_SECRET_KEY
CORS_ORIGINS=["http://localhost:3000", "https://your-domain.com"]

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api/v1
NODE_ENV=production
PORT=3000

# Security
ALLOWED_HOSTS=["your-domain.com", "www.your-domain.com"]
SECURE_SSL_REDIRECT=true

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=INFO

# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your-backup-bucket
EOF

    # Staging environment template
    cat > "$DEPLOY_PATH/staging/.env.staging.template" << EOF
# Staging Environment Configuration
ENVIRONMENT=staging

# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=dao_portal_staging
POSTGRES_USER=dao_user_staging
POSTGRES_PASSWORD=CHANGE_ME_STAGING_PASSWORD
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://\${REDIS_HOST}:\${REDIS_PORT}

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=2
SECRET_KEY=CHANGE_ME_STAGING_SECRET_KEY
CORS_ORIGINS=["http://localhost:3000", "https://staging.your-domain.com"]

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://staging.your-domain.com/api/v1
NODE_ENV=staging
PORT=3000

# Security
ALLOWED_HOSTS=["staging.your-domain.com"]
SECURE_SSL_REDIRECT=false

# Monitoring
LOG_LEVEL=DEBUG
EOF

    # Set proper ownership
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"
    
    log "Environment files created successfully"
    warn "Please update the .env files with your actual configuration values!"
}

# Function to setup nginx configuration
setup_nginx() {
    log "Setting up nginx configuration..."
    
    # Remove default nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create nginx configuration for the application
    cat > "$NGINX_CONFIG_PATH" << 'EOF'
upstream frontend_upstream {
    server localhost:3000 max_fails=3 fail_timeout=30s;
}

upstream backend_upstream {
    server localhost:8000 max_fails=3 fail_timeout=30s;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

server {
    listen 80;
    server_name dao-portal.example.com www.dao-portal.example.com;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss:; frame-ancestors 'none';" always;

    # HSTS (uncomment after SSL is configured)
    # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Frontend routes
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend_upstream/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static assets with long-term caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        proxy_pass http://frontend_upstream;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Cache-Status "STATIC";
        
        # Gzip compression for static assets
        gzip_vary on;
        gzip_types
            text/css
            text/javascript
            text/xml
            text/plain
            application/javascript
            application/xml+rss
            application/json;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(package\.json|composer\.json|Dockerfile|\.env) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Robots.txt
    location = /robots.txt {
        access_log off;
        log_not_found off;
    }

    # Favicon
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }
}

# HTTPS configuration (will be automatically configured by certbot)
# server {
#     listen 443 ssl http2;
#     server_name dao-portal.example.com www.dao-portal.example.com;
#
#     ssl_certificate /etc/letsencrypt/live/dao-portal.example.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/dao-portal.example.com/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     # Same location blocks as HTTP configuration above
# }
EOF

    # Enable the site
    ln -sf "$NGINX_CONFIG_PATH" "$NGINX_ENABLED_PATH"
    
    # Test nginx configuration
    if nginx -t; then
        systemctl reload nginx
        log "Nginx configuration applied successfully"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# Function to setup SSL certificate
setup_ssl() {
    local domain=$1
    
    if [ -z "$domain" ]; then
        warn "No domain provided, skipping SSL setup"
        return 0
    fi
    
    log "Setting up SSL certificate for $domain..."
    
    # Obtain SSL certificate
    certbot --nginx -d "$domain" -d "www.$domain" --non-interactive --agree-tos --email admin@"$domain"
    
    # Setup auto-renewal
    crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -
    
    log "SSL certificate configured successfully"
}

# Function to setup monitoring and logging
setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    # Create log rotation configuration
    cat > "/etc/logrotate.d/$PROJECT_NAME" << EOF
$DEPLOY_PATH/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        docker compose -f $DEPLOY_PATH/production/docker-compose.yml exec backend kill -USR1 1 2>/dev/null || true
    endscript
}
EOF

    # Create monitoring script
    cat > "$DEPLOY_PATH/scripts/monitor.sh" << 'EOF'
#!/bin/bash

# Basic monitoring script for DAO Portal
# This script checks the health of services and sends alerts if needed

DEPLOY_PATH="/home/deploy/dao-portal"
LOG_FILE="$DEPLOY_PATH/logs/monitor.log"
ALERT_EMAIL="admin@example.com"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

check_service() {
    local service_name=$1
    local url=$2
    
    if curl -f --max-time 10 "$url" > /dev/null 2>&1; then
        log "$service_name is healthy"
        return 0
    else
        log "ERROR: $service_name is not responding"
        return 1
    fi
}

# Main monitoring logic
main() {
    log "Starting health check"
    
    # Check frontend
    if ! check_service "Frontend" "http://localhost:3000/health"; then
        # Send alert (implement your preferred alerting method)
        echo "Frontend service is down" | mail -s "DAO Portal Alert" "$ALERT_EMAIL"
    fi
    
    # Check backend
    if ! check_service "Backend" "http://localhost:8000/health"; then
        # Send alert
        echo "Backend service is down" | mail -s "DAO Portal Alert" "$ALERT_EMAIL"
    fi
    
    # Check disk space
    disk_usage=$(df -h "$DEPLOY_PATH" | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        log "WARNING: Disk usage is at ${disk_usage}%"
        echo "Disk usage is at ${disk_usage}%" | mail -s "DAO Portal Disk Alert" "$ALERT_EMAIL"
    fi
    
    log "Health check completed"
}

main "$@"
EOF

    chmod +x "$DEPLOY_PATH/scripts/monitor.sh"
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH/scripts/monitor.sh"
    
    # Add monitoring to crontab (run every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $DEPLOY_PATH/scripts/monitor.sh") | crontab -
    
    log "Monitoring and logging configured successfully"
}

# Main setup function
main() {
    local command=${1:-"full"}
    local domain=$2
    
    case "$command" in
        "full")
            log "Starting full server setup for DAO Portal..."
            check_root
            install_dependencies
            install_docker
            create_deploy_user
            setup_firewall
            setup_fail2ban
            setup_project_directories
            setup_environment_files
            setup_nginx
            setup_monitoring
            
            if [ -n "$domain" ]; then
                setup_ssl "$domain"
            fi
            
            log "Server setup completed successfully!"
            info "Next steps:"
            info "1. Update environment files in $DEPLOY_PATH/{production,staging}/"
            info "2. Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
            info "3. Configure your GitHub repository secrets"
            info "4. Test the deployment pipeline"
            ;;
        "ssl")
            if [ -z "$domain" ]; then
                error "Domain is required for SSL setup"
                exit 1
            fi
            setup_ssl "$domain"
            ;;
        "nginx")
            setup_nginx
            ;;
        "monitoring")
            setup_monitoring
            ;;
        *)
            echo "Usage: $0 [full|ssl|nginx|monitoring] [domain]"
            echo "  full       - Complete server setup"
            echo "  ssl        - Setup SSL certificate (requires domain)"
            echo "  nginx      - Setup nginx configuration"
            echo "  monitoring - Setup monitoring and logging"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
