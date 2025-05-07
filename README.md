# DAO Portal

A production-grade analytics platform for tracking and visualizing DAO metrics.

## Tech Stack

- **Backend**: FastAPI + SQLModel + PostgreSQL/TimescaleDB
- **Background Jobs**: Celery + Redis
- **Authentication**: Keycloak
- **Frontend**: Next.js 14 + TypeScript + shadcn/ui + Tailwind CSS
- **Infrastructure**: Docker Compose, NGINX, GitHub Actions

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/dao-portal.git
   cd dao-portal
   ```

2. Create an environment file:
   ```
   cp .env.example .env
   ```

3. Start the development environment:
   ```
   docker-compose up -d
   ```

4. Access the services:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/v1/docs
   - PgAdmin: http://localhost:5050

## Project Structure

- `backend/`: FastAPI application with SQLModel for database interactions
- `web/`: Next.js frontend application
- `docker-compose.yml`: Docker Compose configuration for development
- `.github/`: CI/CD workflows

## Development

### Backend Development

Navigate to the backend directory:
```
cd backend
```

Install dependencies with Poetry:
```
poetry install
```

### Frontend Development

Navigate to the web directory:
```
cd web
```

Install dependencies:
```
npm install
```

## Deployment

Deployment is handled through GitHub Actions and Docker Compose. Push to the main branch triggers a workflow that builds and publishes the images to GitHub Container Registry.

## License

[MIT](LICENSE)