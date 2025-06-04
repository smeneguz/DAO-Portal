# DAO Portal - Deployment Guide

This guide covers the complete deployment setup for the DAO Portal application with zero-downtime deployment capabilities.

## 🚀 Quick Start

### Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Domain name pointed to your server
- At least 4GB RAM and 20GB disk space
- Root access to the server

### 1. Initial Server Setup

Run the deployment setup script as root:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/dao-portal/main/scripts/deploy-setup.sh | sudo bash -s full yourdomain.com
```

Or manually:

```bash
git clone https://github.com/your-repo/dao-portal.git
cd dao-portal
sudo chmod +x scripts/*.sh
sudo scripts/deploy-setup.sh full yourdomain.com
```

### 2. Configure Environment Variables

Edit the environment files created during setup:

```bash
# Production environment
sudo nano /home/deploy/dao-portal/production/.env.production

# Staging environment  
sudo nano /home/deploy/dao-portal/staging/.env.staging
```

### 3. Set Up GitHub Repository Secrets

Add the following secrets to your GitHub repository:

#### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `PRODUCTION_HOST` | Production server IP/domain | `203.0.113.1` |
| `STAGING_HOST` | Staging server IP/domain | `staging.example.com` |
| `SSH_USERNAME` | SSH username (usually `deploy`) | `deploy` |
| `SSH_PRIVATE_KEY` | Private SSH key for deployment | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port (default: 22) | `22` |
| `DEPLOY_PATH` | Deployment path on server | `/home/deploy/dao-portal` |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `https://api.yourdomain.com/api/v1` |
| `SLACK_WEBHOOK` | Slack webhook for notifications | `https://hooks.slack.com/...` |

#### Optional Secrets

| Secret Name | Description |
|------------|-------------|
| `SENTRY_DSN` | Sentry error tracking DSN |
| `CODECOV_TOKEN` | Codecov integration token |

### 4. Deploy

Push to the appropriate branch to trigger deployment:

```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

## 🏗️ Architecture Overview

### Deployment Strategy

The system uses a **blue-green deployment** strategy for zero-downtime updates:

1. **Blue Environment**: Current production environment
2. **Green Environment**: New deployment environment
3. **Traffic Switch**: Nginx load balancer switches traffic between environments

### Services

- **Frontend**: Next.js application (Port 3000/3001)
- **Backend**: FastAPI application (Port 8000/8001)  
- **Database**: PostgreSQL with TimescaleDB extensions
- **Cache**: Redis for session storage and caching
- **Reverse Proxy**: Nginx with SSL termination
- **Monitoring**: Health checks and automated backups

## 📋 CI/CD Pipeline

### Pipeline Stages

1. **Test Stage**
   - Backend: Poetry dependencies, linting (black, isort, ruff), pytest with coverage
   - Frontend: npm dependencies, ESLint, TypeScript checking, build test
   - Services: PostgreSQL and Redis containers for testing

2. **Security Scan**
   - Trivy vulnerability scanner
   - SARIF results uploaded to GitHub Security

3. **Build & Push**
   - Multi-platform Docker images (linux/amd64, linux/arm64)
   - Images pushed to GitHub Container Registry
   - Metadata and tags extracted for deployment

4. **Deploy Staging** (on `develop` branch)
   - SSH deployment to staging server
   - Environment-specific configuration
   - Health checks after deployment

5. **Deploy Production** (on `main` branch)
   - Database backup before deployment
   - Blue-green deployment with traffic switching
   - Comprehensive health checks
   - Automatic rollback on failure

6. **Notifications**
   - Slack notifications for deployment status
   - Error alerts and success confirmations

### Workflow Triggers

```yaml
# Triggers
- Push to main/develop branches
- Pull requests to main/develop branches
- Manual workflow dispatch
```

## 🔧 Management Scripts

### Health Monitoring

```bash
# Quick health check
./scripts/health-check.sh quick

# Full system health check
./scripts/health-check.sh full

# Monitoring mode (silent, for automation)
./scripts/health-check.sh monitoring
```

### Backup & Recovery

```bash
# Create full backup
./scripts/backup-rollback.sh backup

# Database backup only
./scripts/backup-rollback.sh backup-db

# List available backups
./scripts/backup-rollback.sh list

# Restore database from backup
./scripts/backup-rollback.sh restore-db /path/to/backup.sql.gz

# Rollback deployment
./scripts/backup-rollback.sh rollback
```

### Traffic Management

```bash
# Switch traffic to green environment
sudo ./scripts/switch-traffic.sh green

# Switch traffic to blue environment  
sudo ./scripts/switch-traffic.sh blue
```

## 🐳 Docker Configuration

### Production Stack

```yaml
# docker-compose.production.yml
services:
  - postgres (TimescaleDB)
  - redis (Alpine)
  - backend (FastAPI)
  - frontend (Next.js)
  - nginx (Reverse proxy)
```

### Blue-Green Deployment

```yaml
# docker-compose.blue-green.yml  
# Extends production configuration with:
# - Alternative port mappings (3001, 8001)
# - Service name prefixes
# - Isolated networks
```

### Health Checks

All services include comprehensive health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

## 🔒 Security Features

### Network Security

- UFW firewall with minimal open ports (22, 80, 443)
- Fail2ban for intrusion prevention
- Rate limiting in Nginx
- Security headers (HSTS, CSP, X-Frame-Options)

### Application Security

- Environment-based configuration
- Secrets management via GitHub Secrets
- Container isolation
- Regular security scanning with Trivy

### SSL/TLS

- Automatic SSL certificate provisioning with Let's Encrypt
- HTTP to HTTPS redirects
- HSTS headers for enhanced security
- Certificate expiration monitoring

## 📊 Monitoring & Logging

### Health Monitoring

- Automated health checks every 5 minutes
- Service availability monitoring
- Resource usage tracking (CPU, memory, disk)
- SSL certificate expiration alerts

### Logging

- Centralized logging with log rotation
- Application logs, access logs, error logs
- Retention policy: 30 days
- JSON structured logging for better parsing

### Alerting

- Slack notifications for deployments
- Email alerts for critical issues
- Health check failure notifications
- Resource threshold warnings

## 🔄 Backup Strategy

### Automated Backups

- Daily database backups with compression
- Application code snapshots
- Docker image backups
- 30-day retention policy

### Backup Types

1. **Database Backups**: PostgreSQL dumps with gzip compression
2. **Application Backups**: Code and configuration archives
3. **Docker Image Backups**: Container image exports
4. **Configuration Backups**: Nginx and environment files

### Recovery Procedures

1. **Database Recovery**: Restore from latest backup with minimal downtime
2. **Application Rollback**: Switch to previous deployment version
3. **Full System Recovery**: Complete restoration from backups

## 🎯 Performance Optimization

### Caching Strategy

- Redis for session and query caching
- Nginx static file caching
- CDN integration ready
- Application-level caching

### Load Balancing

- Nginx upstream load balancing
- Health check integration
- Automatic failover
- Connection pooling

### Resource Management

- Docker resource limits
- PostgreSQL connection pooling
- Memory optimization
- CPU allocation management

## 🚨 Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check deployment logs
docker compose logs -f

# Verify service health
./scripts/health-check.sh full

# Check nginx configuration
sudo nginx -t
```

#### Database Issues

```bash
# Check database connectivity
docker compose exec postgres psql -U dao_user -d dao_portal -c "SELECT 1;"

# View database logs
docker compose logs postgres

# Check database size and performance
docker compose exec postgres psql -U dao_user -d dao_portal -c "SELECT pg_size_pretty(pg_database_size('dao_portal'));"
```

#### SSL Certificate Issues

```bash
# Renew SSL certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL configuration
curl -I https://yourdomain.com
```

### Emergency Procedures

#### Immediate Rollback

```bash
# Quick rollback to previous version
./scripts/backup-rollback.sh rollback

# Switch traffic to backup environment
sudo ./scripts/switch-traffic.sh blue
```

#### Service Recovery

```bash
# Restart all services
docker compose down && docker compose up -d

# Restart specific service
docker compose restart backend

# Check service status
docker compose ps
```

## 📝 Maintenance

### Regular Tasks

- Monitor disk space and clean up old backups
- Review and rotate log files
- Update SSL certificates
- Security updates for base images
- Database maintenance and optimization

### Update Procedures

1. **Security Updates**: Apply system updates monthly
2. **Application Updates**: Follow standard deployment process
3. **Database Updates**: Plan maintenance windows for major updates
4. **Infrastructure Updates**: Update Docker images and configurations

### Scaling

The deployment is designed to scale horizontally:

- Add more backend instances via Docker Compose
- Implement database read replicas
- Add Redis cluster for high availability
- Configure CDN for static assets

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `develop`
2. Implement changes with tests
3. Create pull request to `develop`
4. After review, merge to `develop` (deploys to staging)
5. Create release PR from `develop` to `main`
6. Merge to `main` (deploys to production)

### Testing

```bash
# Run backend tests
cd backend && poetry run pytest

# Run frontend tests  
cd web && npm test

# Run integration tests
./scripts/test-integration.sh
```

## 📞 Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review application logs and health checks
3. Consult the monitoring dashboard
4. Contact the development team

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated**: June 2025  
**Version**: 1.0.0
