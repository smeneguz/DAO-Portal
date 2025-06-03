# DAO Portal

A production-grade analytics platform for tracking and visualizing DAO metrics.

## Tech Stack

- **Backend**: FastAPI + SQLModel + PostgreSQL/TimescaleDB
- **Background Jobs**: Celery + Redis
- **Authentication**: Keycloak (planned)
- **Frontend**: Next.js 14 + TypeScript + shadcn/ui + Tailwind CSS + Recharts
- **Infrastructure**: Docker Compose, NGINX, GitHub Actions

## Features

- Single DAO analytics dashboard with multiple metrics visualization
- Multi-DAO comparison with interactive charts
- Decentralization analysis across multiple DAOs
- Export capabilities for charts (SVG/PNG)
- Responsive UI for desktop and mobile viewing
- Dark/light mode support

## System Architecture

The DAO Portal consists of the following components:

1. **Backend**: FastAPI with SQLModel, running in a Docker container
2. **Database**: PostgreSQL with TimescaleDB extension
3. **Cache/Message Broker**: Redis for Celery tasks
4. **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
5. **Admin Interface**: pgAdmin for database management

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- Node.js (for local frontend development)

### Quick Start

#### 1. Clone the Repository

```bash
# Create a new project directory
mkdir dao-portal
cd dao-portal

# Clone the repository (or initialize a new one)
git clone https://github.com/your-username/dao-portal.git .
# OR
git init
```

#### 2. Start the Backend Services

```bash
# Create required directories if they don't exist
mkdir -p raw_json

# Start PostgreSQL, Redis, and pgAdmin
docker compose up -d postgres pgadmin redis

# Wait for services to be healthy, then start the backend
docker compose up -d backend
```

#### 3. Initialize the Database

```bash
# Run the initialization script
docker exec -it dao-portal-backend python /app/init_db.py

# Import sample data
docker exec -it dao-portal-backend python /app/import_dao_data.py /data/dao_data.json
```

#### 4. Set Up and Run the Frontend

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

#### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Database Admin**: http://localhost:5050 (login with admin@example.com / admin)

## Project Structure

```
dao-portal/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   │   └── v1/
│   │   │       ├── dao.py
│   │   │       ├── metrics.py
│   │   │       └── enhanced_metrics.py
│   │   ├── core/            # Core configs
│   │   ├── db/              # Database models and session
│   │   ├── workers/         # Celery workers
│   │   └── main.py
│   ├── import_data.py       # Data import utilities
│   └── init_db.py           # DB initialization script
├── web/                     # Next.js frontend
│   ├── app/
│   │   ├── dao/
│   │   │   ├── [id]/        # Single DAO page
│   │   │   └── compare/     # Compare DAOs page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   ├── charts/          # Chart components
│   │   │   ├── multi-dao/   # Multi-DAO charts
│   │   │   └── ...
│   │   ├── layout/          # Layout components
│   │   └── ui/              # UI components
│   ├── lib/
│   │   ├── context/         # React context
│   │   └── hooks/           # Custom hooks
│   └── public/
└── docker-compose.yml       # Docker Compose configuration
```

## Chart Components

### Single DAO Charts

Single DAO charts provide detailed visualizations for individual DAOs, including:

- **Participation Charts**: Visualize voter participation rates over time
- **Token Distribution Charts**: Show distribution of tokens across wallets
- **Treasury Charts**: Track treasury value and token supply
- **Proposal Charts**: Display proposal statistics and approval rates

To use single DAO charts in your components:

```tsx
import { SingleDAOCharts } from '@/components/charts/SingleDAOCharts';

// Inside your component
<SingleDAOCharts daoId={123} daoName="Uniswap" />
```

### Multi-DAO Comparison Charts

Multi-DAO charts allow comparison between multiple DAOs:

- **Radar Charts**: Compare multiple metrics across DAOs
- **Decentralization Scatter Plot**: Plot largest holder percentage vs. participation rate
- **Participation Trends**: Compare participation across multiple DAOs
- **Treasury Analysis**: Compare treasury value and token metrics

To use multi-DAO charts:

```tsx
import { MultiDAOComparisonChart } from '@/components/charts/multi-dao/MultiDAOComparisonChart';

// Inside your component
<MultiDAOComparisonChart daoIds={[1, 2, 3, 4]} />
```

### DAO Selection

The application includes a DAO selection system that allows users to select DAOs for comparison:

```tsx
import { useDAOSelection } from '@/lib/context/DAOSelectionContext';

// Inside your component
const { 
  selectedDAOIds, 
  toggleDAOSelection, 
  isDAOSelected 
} = useDAOSelection();

// Toggle selection
<Button onClick={() => toggleDAOSelection(daoId)}>
  {isDAOSelected(daoId) ? 'Selected' : 'Add to Compare'}
</Button>
```

## API Endpoints

The backend provides a comprehensive set of API endpoints:

### DAO Endpoints

- `GET /api/v1/daos`: List all DAOs with filtering options
- `GET /api/v1/daos/{id}`: Get details for a specific DAO

### Metrics Endpoints

- `GET /api/v1/daos/{id}/metrics`: Get metrics for a specific DAO
- `GET /api/v1/daos/{id}/enhanced_metrics`: Get all metrics for a specific DAO in a combined format
- `GET /api/v1/daos/metrics/multi?dao_ids=1,2,3`: Get metrics for multiple DAOs at once

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

## Production Deployment

For production deployment, consider the following:

1. **NGINX Configuration**: Set up NGINX as reverse proxy with proper SSL configuration
2. **Keycloak Integration**: Configure Keycloak for user authentication and authorization
3. **GitHub Actions**: Set up CI/CD pipeline for automated testing and deployment
4. **Monitoring**: Add Prometheus and Grafana for system monitoring

## Next Steps

1. Implement authentication with Keycloak
2. Add user dashboard with saved DAO comparisons
3. Add time-series charts for metrics over time
4. Implement cache layer for improved performance
5. Add export functionality for data in CSV/Excel format

## Troubleshooting

- **Database connection issues**: Check the environment variables in the backend service
- **API not responding**: Check backend logs with `docker logs -f dao-portal-backend`
- **Frontend not connecting to API**: Verify the `NEXT_PUBLIC_API_URL` in `.env.local`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.