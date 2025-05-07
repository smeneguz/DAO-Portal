# DAO Portal - Getting Started Guide

This guide provides the essential commands and steps to set up the DAO Portal application on a new machine.

## System Architecture

The DAO Portal consists of the following components:

1. **Backend**: FastAPI with SQLModel, running in a Docker container
2. **Database**: PostgreSQL with TimescaleDB extension
3. **Cache/Message Broker**: Redis for Celery tasks
4. **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
5. **Admin Interface**: pgAdmin for database management

## Prerequisites

- Docker and Docker Compose
- Git
- Node.js (for local frontend development)

## Quick Start Guide

### 1. Clone the Repository

```bash
# Create a new project directory
mkdir dao-portal
cd dao-portal

# Clone the repository (or initialize a new one)
git clone https://github.com/your-username/dao-portal.git .
# OR
git init
```

### 2. Start the Backend Services

```bash
# Create required directories if they don't exist
mkdir -p raw_json

# Start PostgreSQL, Redis, and pgAdmin
docker compose up -d postgres pgadmin redis

# Wait for services to be healthy, then start the backend
docker compose up -d backend
```

### 3. Initialize the Database

```bash
# Create a SQL initialization file
cat > backend/init_db.sql << 'EOF'
-- SQL content (see the existing init_db.sql file)
EOF

# Run the SQL file to create tables and add sample data
docker cp backend/init_db.sql dao-portal-postgres:/tmp/
docker exec -it dao-portal-postgres bash -c "psql -U dao_user -d dao_portal -f /tmp/init_db.sql"

# Verify data was added
docker exec -it dao-portal-postgres psql -U dao_user -d dao_portal -c "SELECT * FROM dao;"
```

### 4. Set Up and Run the Frontend

```bash
# Change to the frontend directory
cd web

# Install dependencies
npm install

# Create environment file for API connection
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
EOF

# Start the development server
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Database Admin**: http://localhost:5050 (login with admin@example.com / admin)

## Administration

### Restarting Services

```bash
# Restart specific service
docker restart dao-portal-backend

# Restart all services
docker compose restart
```

### Viewing Logs

```bash
# View logs from a specific service
docker logs -f dao-portal-backend

# View combined logs from all services
docker compose logs -f
```

### Database Operations

```bash
# Connect to the database CLI
docker exec -it dao-portal-postgres psql -U dao_user -d dao_portal

# Backup the database
docker exec -t dao-portal-postgres pg_dump -U dao_user dao_portal > backup.sql

# Restore from backup
cat backup.sql | docker exec -i dao-portal-postgres psql -U dao_user -d dao_portal
```

## Development Workflow

1. Backend changes are automatically detected and reloaded (using `--reload` flag)
2. Frontend changes are automatically detected and reloaded by Next.js
3. Database schema changes require manual migration or updating the initialization script

## Troubleshooting

- **Database connection issues**: Check the environment variables in the backend service
- **API not responding**: Check backend logs with `docker logs -f dao-portal-backend`
- **Frontend not connecting to API**: Verify the `NEXT_PUBLIC_API_URL` in `.env.local`

## Next Steps

- Set up Keycloak for authentication
- Configure the Celery worker for background tasks
- Add NGINX as a reverse proxy
- Set up CI/CD with GitHub Actions