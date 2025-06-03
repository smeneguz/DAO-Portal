# DAO Portal Implementation Guide

This step-by-step guide will help you implement the DAO Portal project, focusing on integrating charts for single DAOs and comparison functionality. Follow these steps in sequence to build a fully-functional system.

## 1. Setup the Backend API

### 1.1. Database Models

First, ensure your database models are set up correctly:

```bash
# Create a copy of the models.py file in app/db/
cp -p app/db/models.py app/db/models.py.bak

# Edit the models.py file to match our enhanced schema
nano app/db/models.py
```

### 1.2. Enhanced Metrics API

Next, implement the enhanced metrics API endpoints:

```bash
# Create the enhanced_metrics.py file
mkdir -p app/api/v1
touch app/api/v1/enhanced_metrics.py

# Edit the file with the code provided in the backend-api-enhancements artifact
nano app/api/v1/enhanced_metrics.py
```

### 1.3. Update the main.py file

```bash
# Edit the main.py file to include the new router
nano app/main.py
```

Make sure to register the enhanced_metrics router in the main.py file.

### 1.4. Update the schemas.py file

```bash
# Add the new schemas to the schemas.py file
nano app/api/schemas.py
```

### 1.5. Initialize the database and import data

```bash
# Run the database initialization script
python init_db.py

# Import the DAO data from the provided JSON
python import_dao_data.py /data/dao_data.json
```

## 2. Setup the Frontend

### 2.1. Install required packages

```bash
cd web
npm install recharts lodash next-themes date-fns
```

### 2.2. Create the context provider

```bash
# Create the directory structure
mkdir -p lib/context lib/hooks

# Create the DAOSelectionContext.tsx file
touch lib/context/DAOSelectionContext.tsx
touch lib/hooks/useLocalStorage.ts
```

Copy the content from the `dao-context-provider` artifact into these files.

### 2.3. Create the custom hooks

```bash
# Create the API hooks
touch lib/hooks/useMultiDAOMetrics.ts
```

Copy the content from the `api-hooks` artifact into this file.

### 2.4. Create the chart components

```bash
# Create directory structure for charts
mkdir -p components/charts/multi-dao

# Create the SingleDAOCharts.tsx file
touch components/charts/SingleDAOCharts.tsx

# Create the TokenDistributionChart.tsx file
touch components/charts/TokenDistributionChart.tsx

# Create the ParticipationChart.tsx file
touch components/charts/ParticipationChart.tsx
```

Copy the content from the respective artifacts into these files.

### 2.5. Create the multi-DAO chart components

```bash
# Create the MultiDAOSelector.tsx file
touch components/charts/multi-dao/MultiDAOSelector.tsx

# Create the MultiDAOComparisonChart.tsx file
touch components/charts/multi-dao/MultiDAOComparisonChart.tsx

# Create the MultiDAODecentralizationChart.tsx file
touch components/charts/multi-dao/MultiDAODecentralizationChart.tsx

# Create the CompareDAOPage.tsx file
touch components/charts/multi-dao/CompareDAOPage.tsx
```

Copy the content from the `multi-dao-charts` artifact into these files.

### 2.6. Set up the app layout and routes

```bash
# Update the layout.tsx file
nano app/layout.tsx

# Create the DAO detail page
mkdir -p app/dao/[id]
touch app/dao/[id]/page.tsx

# Create the DAO comparison page
mkdir -p app/dao/compare
touch app/dao/compare/page.tsx

# Update the home page
nano app/page.tsx

# Update the navbar
nano components/navbar.tsx
```

Copy the content from the `app-integration` artifact into these files.

## 3. Test and Refine

### 3.1. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3.2. Start the frontend

```bash
cd web
npm run dev
```

### 3.3. Access the application

- Open http://localhost:3000 in your browser
- Test single DAO visualizations by clicking on a DAO
- Test multi-DAO comparison by selecting multiple DAOs and visiting the compare page

## 4. Integration with the Existing Charts

To integrate the charts from your other repo:

### 4.1. Copy the chart components

```bash
# Create a backup directory for the original charts
mkdir -p web/components/charts/backup

# Copy your existing chart components from the other repo
cp -r /path/to/other/repo/src/components/visualization/KPIAnalysis/* web/components/charts/backup/
```

### 4.2. Adapt the chart components

For each chart component you want to integrate:

1. Review the component structure and dependencies
2. Update imports to match the Next.js project structure
3. Modify the component to accept `daoIds` as a prop
4. Update data fetching to use the `useMultiDAOMetrics` hook
5. Integrate the component into `CompareDAOPage.tsx`

Example adaptation for the DecentralizationAnalysis component:

```jsx
// Before (in original repo)
const DecentralizationAnalysis = () => {
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/data/dao-metrics.json');
      const jsonData = await response.json();
      // Process data...
    }
    fetchData();
  }, []);
  
  // Render chart...
}

// After (adapted for DAO Portal)
interface DecentralizationAnalysisProps {
  daoIds: number[];
}

const DecentralizationAnalysis: React.FC<DecentralizationAnalysisProps> = ({ daoIds }) => {
  const { data, isLoading, error } = useMultiDAOMetrics(daoIds);
  
  useEffect(() => {
    if (!data) return;
    
    // Process data...
  }, [data]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  
  // Render chart...
}
```

### 4.3. Add to the CompareDAOPage tabs

```jsx
// In components/charts/multi-dao/CompareDAOPage.tsx
<TabsContent value="decentralization">
  <DecentralizationAnalysis daoIds={selectedDAOs} />
</TabsContent>
```

## 5. Production Deployment

### 5.1. Build the frontend

```bash
cd web
npm run build
```

### 5.2. Configure the Docker Compose file

Update the Docker Compose file to include all necessary services:

```yaml
version: '3.8'

services:
  postgres:
    # PostgreSQL configuration...
  
  redis:
    # Redis configuration...
  
  backend:
    # Backend configuration...
  
  frontend:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
```

### 5.3. Create an NGINX configuration file

```bash
mkdir -p nginx/conf.d
touch nginx/conf.d/default.conf
```

Example NGINX configuration:

```nginx
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5.4. Start the production stack

```bash
docker-compose up -d
```

## 6. Additional Customizations

### 6.1. Add time-series data support

To add support for time-series metrics:

1. Create a new API endpoint that returns metrics over time:

```python
@router.get("/{dao_id}/metrics/timeseries")
async def get_dao_metrics_timeseries(
    dao_id: int,
    metric_name: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Implementation...
```

2. Create a new hook to fetch time-series data:

```typescript
export const useDAOMetricsTimeSeries = (
  daoId: number,
  metricName: string,
  fromDate?: string,
  toDate?: string
) => {
  // Implementation...
};
```

3. Create a time-series chart component:

```tsx
const TimeSeriesChart: React.FC<{ daoId: number, metricName: string }> = ({ daoId, metricName }) => {
  const { data, isLoading, error } = useDAOMetricsTimeSeries(daoId, metricName);
  
  // Implementation...
};
```

### 6.2. Add metric dashboards

For more comprehensive dashboards:

1. Create a dashboard configuration schema:

```typescript
interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  charts: {
    id: string;
    type: 'line' | 'bar' | 'radar' | 'pie' | 'scatter';
    metric: string;
    title: string;
    width: 1 | 2 | 3 | 4; // Grid columns
    height: 1 | 2 | 3; // Grid rows
  }[];
}
```

2. Create a dashboard component that uses the configuration:

```tsx
const MetricDashboard: React.FC<{ config: DashboardConfig, daoId: number }> = ({ config, daoId }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {config.charts.map(chart => (
        <div 
          key={chart.id} 
          className={`col-span-${chart.width} row-span-${chart.height}`}
        >
          <DynamicChart type={chart.type} metric={chart.metric} daoId={daoId} title={chart.title} />
        </div>
      ))}
    </div>
  );
};
```

## 7. Next Steps

After you've completed the initial implementation, consider these enhancements:

1. Implement authentication with Keycloak
2. Add data export capabilities (CSV, Excel)
3. Create user dashboards with saved comparisons
4. Add more advanced chart types (network graphs, heat maps)
5. Implement real-time updates using WebSockets
6. Add alerts for metrics that cross predefined thresholds

Following this guide will give you a solid foundation for your DAO Portal, with both single DAO visualization and multi-DAO comparison capabilities. The modular design allows for easy extension and customization as your needs evolve.