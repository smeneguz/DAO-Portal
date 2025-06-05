# DAO Portal Production Deployment Guide

## 🎯 Production Server Details

**Server**: `130.192.84.45`  
**OS**: Ubuntu  
**Access**: SSH with key authentication  
**Deploy Date**: June 5, 2025  
**Status**: ✅ LIVE AND OPERATIONAL

---

## 🌐 External Access Endpoints

### Primary Application
- **Frontend**: http://130.192.84.45:8080
- **API Root**: http://130.192.84.45:8080/api/v1/
- **API Documentation**: http://130.192.84.45:8080/api/v1/docs

### Management Tools
- **Database Admin (PgAdmin)**: http://130.192.84.45:5050
- **Health Check**: http://130.192.84.45:8080/health

### API Endpoints Examples
```bash
# Get all DAOs
curl http://130.192.84.45:8080/api/v1/daos

# Get specific DAO
curl http://130.192.84.45:8080/api/v1/daos/1

# Get DAO metrics
curl http://130.192.84.45:8080/api/v1/daos/1/metrics

# Get DAOs with pagination
curl "http://130.192.84.45:8080/api/v1/daos?limit=10&offset=0"
```

---

## 🏗️ Architecture Overview

### Port Configuration
- **8080**: HTTP access (external) → Nginx reverse proxy
- **8443**: HTTPS access (prepared for future SSL)
- **3000**: Frontend (Next.js) - internal
- **8000**: Backend (FastAPI) - internal
- **5432**: PostgreSQL database - internal
- **6379**: Redis cache - internal
- **5050**: PgAdmin - external

### Container Stack
```
┌─────────────────────────────────────────┐
│           Nginx (System)                │
│        Ports: 8080, 8443               │
└─────────────┬───────────────────────────┘
              │
   ┌──────────▼──────────┐    ┌─────────────────┐
   │   Frontend (3000)   │    │  Backend (8000) │
   │      Next.js        │    │     FastAPI     │
   └─────────────────────┘    └─────────┬───────┘
                                        │
              ┌─────────────────────────┼─────────────────┐
              │                         │                 │
    ┌─────────▼─────────┐    ┌─────────▼──────┐    ┌─────▼─────┐
    │ PostgreSQL (5432) │    │ Redis (6379)   │    │PgAdmin    │
    │   TimescaleDB     │    │    Cache       │    │ (5050)    │
    └───────────────────┘    └────────────────┘    └───────────┘
```

---

## 📊 Current Data Status

- **Total DAOs**: 50 organizations
- **Data Imported**: ✅ Complete with all metrics
- **Sample DAOs**: Uniswap, Aave, Lido DAO, Maker, ENS, Curve, Compound, Arbitrum, Optimism, dYdX, etc.

### Metrics Available per DAO
- Network participation (voters, members, participation rates)
- Treasury/accumulated funds (USD values, token supply, velocity)
- Voting efficiency (proposals, approval rates, duration)
- Decentralization metrics (token distribution, holder concentration)
- Health metrics (network scores, activity, volume)

---

## 🚀 Code Update & Deployment Procedures

### When Code Changes in GitHub

#### 1. Connect to Production Server
```bash
ssh ubuntu@130.192.84.45
```

#### 2. Navigate to Project Directory
```bash
cd /opt/dao-portal
```

#### 3. Pull Latest Changes
```bash
sudo git pull origin main
```

#### 4. Update Frontend (if web/ changed)
```bash
# Copy any new frontend lib files if needed
sudo docker-compose -f docker-compose.build.yml up -d --build frontend
```

#### 5. Update Backend (if backend/ changed)
```bash
# Rebuild backend container
sudo docker-compose -f docker-compose.build.yml up -d --build backend
```

#### 6. Full Stack Rebuild (if major changes)
```bash
# Stop all services
sudo docker-compose -f docker-compose.build.yml down

# Rebuild all containers
sudo docker-compose -f docker-compose.build.yml up -d --build

# Verify all services are healthy
sudo docker-compose -f docker-compose.build.yml ps
```

#### 7. Import New Data (if dao_data.json updated)
```bash
# Copy new data file to server
scp dao_data.json ubuntu@130.192.84.45:/opt/dao-portal/

# Copy to container and import
sudo docker cp dao_data.json dao-portal-backend:/data/dao_data.json
sudo docker exec dao-portal-backend python import_dao_data.py /data/dao_data.json
```

---

## 🔧 Environment Configuration

### Active Configuration Files
```
/opt/dao-portal/
├── .env.production              # Environment variables
├── docker-compose.build.yml     # Active compose file (local build)
├── docker-compose.production.yml # Registry-based compose (backup)
└── dao_data.json               # DAO data for import
```

### Key Environment Variables
```env
GITHUB_REPOSITORY=silviomeneguzzo/dao-portal
POSTGRES_USER=dao_user
POSTGRES_PASSWORD=dao_password
POSTGRES_DB=dao_portal
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Nginx Configuration
```
/etc/nginx/sites-available/dao-portal
/etc/nginx/sites-enabled/dao-portal (symlink)
/etc/nginx/ssl/nginx-selfsigned.crt
/etc/nginx/ssl/nginx-selfsigned.key
```

---

## 🏥 Health Monitoring

### Check All Container Status
```bash
ssh ubuntu@130.192.84.45 "cd /opt/dao-portal && sudo docker-compose -f docker-compose.build.yml ps"
```

### Check Individual Service Health
```bash
# Frontend health
curl -I http://130.192.84.45:8080

# Backend health
curl http://130.192.84.45:8080/health

# API functionality
curl http://130.192.84.45:8080/api/v1/daos | head -20

# Database connectivity (through API)
curl "http://130.192.84.45:8080/api/v1/daos?limit=1"
```

### View Container Logs
```bash
# Backend logs
sudo docker logs dao-portal-backend

# Frontend logs
sudo docker logs dao-portal-frontend

# Database logs
sudo docker logs dao-portal-postgres
```

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Create database backup
sudo docker exec dao-portal-postgres pg_dump -U dao_user dao_portal > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
sudo docker exec -i dao-portal-postgres psql -U dao_user dao_portal < backup_file.sql
```

### Container Data Backup
```bash
# Export container data
sudo docker volume ls | grep dao-portal
sudo docker run --rm -v dao-portal_postgres_data:/data -v $(pwd):/backup busybox tar czf /backup/postgres_backup.tar.gz /data
```

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Container Won't Start
```bash
# Check container logs
sudo docker logs dao-portal-[service-name]

# Restart specific service
sudo docker-compose -f docker-compose.build.yml restart [service-name]
```

#### 2. Database Connection Issues
```bash
# Check database container
sudo docker exec dao-portal-postgres pg_isready -U dao_user

# Recreate database connections
sudo docker-compose -f docker-compose.build.yml restart backend
```

#### 3. Frontend Not Loading
```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Check frontend container
sudo docker logs dao-portal-frontend
```

#### 4. API Returns Empty Data
```bash
# Check if data exists in database
sudo docker exec dao-portal-postgres psql -U dao_user dao_portal -c "SELECT COUNT(*) FROM dao;"

# Re-import data if needed
sudo docker exec dao-portal-backend python import_dao_data.py /data/dao_data.json
```

---

## 🔒 Security Configuration

### Firewall Rules (UFW)
```bash
# Check current rules
sudo ufw status

# Currently open ports:
# 22 (SSH), 8080 (HTTP), 8443 (HTTPS future)
```

### SSL Configuration
- Self-signed certificates installed for development
- Ready for Let's Encrypt when domain is available
- HTTPS on port 8443 configured but not enforced yet

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check application accessibility: http://130.192.84.45:8080
- [ ] Verify API response: `curl http://130.192.84.45:8080/api/v1/daos | grep total_count`

### Weekly
- [ ] Check container health status
- [ ] Review container logs for errors
- [ ] Verify database backup size

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Check disk space: `df -h`
- [ ] Review nginx access logs

---

## 📞 Quick Reference Commands

### Essential Commands
```bash
# SSH to server
ssh ubuntu@130.192.84.45

# Go to project directory
cd /opt/dao-portal

# Check all services
sudo docker-compose -f docker-compose.build.yml ps

# View logs
sudo docker-compose -f docker-compose.build.yml logs [service-name]

# Restart all services
sudo docker-compose -f docker-compose.build.yml restart

# Full rebuild
sudo docker-compose -f docker-compose.build.yml up -d --build
```

### Test Endpoints
```bash
# Quick health check
curl -I http://130.192.84.45:8080

# API test
curl http://130.192.84.45:8080/api/v1/daos?limit=5

# Specific DAO test
curl http://130.192.84.45:8080/api/v1/daos/1/metrics
```

---

## 🎯 Future Migration Notes

### When Standard Ports (80/443) Become Available

1. **Update Nginx Configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/dao-portal
   # Uncomment port 80/443 sections
   # Comment out port 8080/8443 sections
   ```

2. **Update Firewall**:
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw delete allow 8080
   sudo ufw delete allow 8443
   ```

3. **Setup Let's Encrypt** (when domain available):
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

**Last Updated**: June 5, 2025  
**Deployment Status**: ✅ Production Ready  
**Contact**: Available at http://130.192.84.45:8080
