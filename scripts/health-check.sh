#!/bin/bash

# Health Check Script for DAO Portal
# This script performs comprehensive health checks on all services

set -e

# Configuration
DEPLOY_PATH="/home/deploy/dao-portal"
LOG_FILE="$DEPLOY_PATH/logs/health-check.log"
HEALTH_CHECK_TIMEOUT=30
MAX_RETRIES=3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

error() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

warn() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

info() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
    echo -e "${BLUE}$message${NC}"
    echo "$message" >> "$LOG_FILE"
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local timeout=${4:-$HEALTH_CHECK_TIMEOUT}
    
    log "Checking $name at $url"
    
    local response=$(curl -s -o /tmp/health_response -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log "$name is healthy (HTTP $response)"
        return 0
    else
        error "$name is unhealthy (HTTP $response)"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    log "Checking database connectivity"
    
    # Source environment variables
    if [ -f "$DEPLOY_PATH/production/.env" ]; then
        source "$DEPLOY_PATH/production/.env"
    else
        error "Environment file not found"
        return 1
    fi
    
    # Check if PostgreSQL container is running
    if ! docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" ps postgres | grep -q "Up"; then
        error "PostgreSQL container is not running"
        return 1
    fi
    
    # Test database connection
    local db_check=$(docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" exec -T postgres \
        psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" 2>/dev/null | grep -c "1 row" || echo "0")
    
    if [ "$db_check" = "1" ]; then
        log "Database connectivity is healthy"
        return 0
    else
        error "Database connectivity check failed"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    log "Checking Redis connectivity"
    
    # Check if Redis container is running
    if ! docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" ps redis | grep -q "Up"; then
        error "Redis container is not running"
        return 1
    fi
    
    # Test Redis connection
    local redis_check=$(docker compose -f "$DEPLOY_PATH/production/docker-compose.yml" exec -T redis \
        redis-cli ping 2>/dev/null || echo "FAIL")
    
    if [ "$redis_check" = "PONG" ]; then
        log "Redis connectivity is healthy"
        return 0
    else
        error "Redis connectivity check failed"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    log "Checking Docker containers status"
    
    local compose_file="$DEPLOY_PATH/production/docker-compose.yml"
    local all_healthy=true
    
    # Check each service
    for service in frontend backend postgres redis; do
        local status=$(docker compose -f "$compose_file" ps "$service" --format "table {{.Status}}" | tail -n +2)
        
        if echo "$status" | grep -q "Up"; then
            log "$service container is running"
        else
            error "$service container is not running properly: $status"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to check system resources
check_system_resources() {
    log "Checking system resources"
    
    # Check disk space
    local disk_usage=$(df -h "$DEPLOY_PATH" | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        error "Disk usage is critically high: ${disk_usage}%"
        return 1
    elif [ "$disk_usage" -gt 80 ]; then
        warn "Disk usage is high: ${disk_usage}%"
    else
        log "Disk usage is acceptable: ${disk_usage}%"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$mem_usage" -gt 90 ]; then
        error "Memory usage is critically high: ${mem_usage}%"
        return 1
    elif [ "$mem_usage" -gt 80 ]; then
        warn "Memory usage is high: ${mem_usage}%"
    else
        log "Memory usage is acceptable: ${mem_usage}%"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_threshold=$(echo "$cpu_cores * 2" | bc)
    
    if (( $(echo "$load_avg > $load_threshold" | bc -l) )); then
        warn "System load is high: $load_avg (threshold: $load_threshold)"
    else
        log "System load is acceptable: $load_avg"
    fi
    
    return 0
}

# Function to check SSL certificate
check_ssl_certificate() {
    local domain=${1:-"dao-portal.example.com"}
    
    log "Checking SSL certificate for $domain"
    
    # Check if SSL certificate exists and is valid
    if command -v openssl >/dev/null 2>&1; then
        local cert_path="/etc/letsencrypt/live/$domain/fullchain.pem"
        
        if [ -f "$cert_path" ]; then
            local expiry_date=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
            local expiry_epoch=$(date -d "$expiry_date" +%s)
            local current_epoch=$(date +%s)
            local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [ "$days_until_expiry" -lt 7 ]; then
                error "SSL certificate expires in $days_until_expiry days"
                return 1
            elif [ "$days_until_expiry" -lt 30 ]; then
                warn "SSL certificate expires in $days_until_expiry days"
            else
                log "SSL certificate is valid for $days_until_expiry more days"
            fi
        else
            warn "SSL certificate not found at $cert_path"
        fi
    else
        warn "OpenSSL not available, skipping SSL certificate check"
    fi
    
    return 0
}

# Function to check nginx status
check_nginx() {
    log "Checking Nginx status"
    
    # Check if nginx is running
    if systemctl is-active --quiet nginx; then
        log "Nginx service is running"
        
        # Test nginx configuration
        if nginx -t 2>/dev/null; then
            log "Nginx configuration is valid"
        else
            error "Nginx configuration test failed"
            return 1
        fi
    else
        error "Nginx service is not running"
        return 1
    fi
    
    return 0
}

# Function to perform application-specific health checks
check_application_health() {
    log "Performing application-specific health checks"
    
    # Check if we can retrieve DAOs (basic functionality test)
    local api_test=$(curl -s --max-time 10 "http://localhost:8000/api/v1/daos?limit=1" | jq -r '.data | length' 2>/dev/null || echo "error")
    
    if [ "$api_test" != "error" ] && [ "$api_test" -ge 0 ]; then
        log "API functionality test passed"
    else
        error "API functionality test failed"
        return 1
    fi
    
    # Check if frontend can load (basic test)
    if curl -s --max-time 10 "http://localhost:3000" | grep -q "DAO Portal" 2>/dev/null; then
        log "Frontend loading test passed"
    else
        error "Frontend loading test failed"
        return 1
    fi
    
    return 0
}

# Function to generate health report
generate_health_report() {
    local overall_status=$1
    local report_file="$DEPLOY_PATH/logs/health-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -Iseconds)",
    "overall_status": "$overall_status",
    "checks": {
        "frontend": $([ "$frontend_status" = "0" ] && echo "true" || echo "false"),
        "backend": $([ "$backend_status" = "0" ] && echo "true" || echo "false"),
        "database": $([ "$database_status" = "0" ] && echo "true" || echo "false"),
        "redis": $([ "$redis_status" = "0" ] && echo "true" || echo "false"),
        "containers": $([ "$containers_status" = "0" ] && echo "true" || echo "false"),
        "system_resources": $([ "$resources_status" = "0" ] && echo "true" || echo "false"),
        "nginx": $([ "$nginx_status" = "0" ] && echo "true" || echo "false"),
        "ssl": $([ "$ssl_status" = "0" ] && echo "true" || echo "false"),
        "application": $([ "$application_status" = "0" ] && echo "true" || echo "false")
    },
    "system_info": {
        "uptime": "$(uptime -p)",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}')",
        "memory_usage": "$(free -h | awk 'NR==2{printf "%s/%s (%.2f%%)", $3,$2,$3*100/$2}')",
        "disk_usage": "$(df -h $DEPLOY_PATH | awk 'NR==2{printf "%s/%s (%s)", $3,$2,$5}')"
    }
}
EOF

    log "Health report generated: $report_file"
}

# Main health check function
main() {
    local mode=${1:-"full"}
    local overall_status="healthy"
    
    log "Starting health check (mode: $mode)"
    
    case "$mode" in
        "quick")
            # Quick health check - basic endpoints only
            check_http_endpoint "Frontend" "http://localhost:3000/health" || frontend_status=1
            check_http_endpoint "Backend" "http://localhost:8000/health" || backend_status=1
            ;;
        "full")
            # Full health check
            check_containers || containers_status=1
            check_http_endpoint "Frontend" "http://localhost:3000/health" || frontend_status=1
            check_http_endpoint "Backend" "http://localhost:8000/health" || backend_status=1
            check_database || database_status=1
            check_redis || redis_status=1
            check_system_resources || resources_status=1
            check_nginx || nginx_status=1
            check_ssl_certificate || ssl_status=1
            check_application_health || application_status=1
            ;;
        "monitoring")
            # Monitoring mode - for automated systems
            check_http_endpoint "Frontend" "http://localhost:3000/health" > /dev/null || frontend_status=1
            check_http_endpoint "Backend" "http://localhost:8000/health" > /dev/null || backend_status=1
            check_system_resources > /dev/null || resources_status=1
            ;;
        *)
            error "Unknown mode: $mode"
            echo "Usage: $0 [quick|full|monitoring]"
            exit 1
            ;;
    esac
    
    # Determine overall status
    if [ "${frontend_status:-0}" != "0" ] || [ "${backend_status:-0}" != "0" ] || 
       [ "${database_status:-0}" != "0" ] || [ "${redis_status:-0}" != "0" ] ||
       [ "${containers_status:-0}" != "0" ] || [ "${resources_status:-0}" != "0" ] ||
       [ "${nginx_status:-0}" != "0" ] || [ "${application_status:-0}" != "0" ]; then
        overall_status="unhealthy"
    fi
    
    # Generate report for full checks
    if [ "$mode" = "full" ]; then
        generate_health_report "$overall_status"
    fi
    
    if [ "$overall_status" = "healthy" ]; then
        log "All health checks passed - system is healthy"
        exit 0
    else
        error "Some health checks failed - system needs attention"
        exit 1
    fi
}

# Run main function
main "$@"
