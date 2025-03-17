# Ad Analytics ETL System (Node.js)

A comprehensive ETL system for ad analytics with mock data generation, ClickHouse integration, and a real-time analytics dashboard - built entirely with Node.js and TypeScript.

## Features

- **Mock Data Generation**: Automatically generates realistic ad metrics data
- **ETL Pipeline**: Processes and aggregates data using Bull queue
- **OLAP Storage**: Uses ClickHouse for efficient analytics queries
- **Real-time Dashboard**: React-based UI for visualizing metrics
- **REST API**: Express.js backend with TypeScript
- **Containerization**: Complete Docker setup for all components

## Architecture

The system consists of several components:

1. **Backend API (Express.js + TypeScript)**
   - Handles API requests for metrics
   - Integrates with ClickHouse for data queries
   - Provides real-time and historical metrics

2. **Mock Data Generator**
   - Generates realistic ad metrics
   - Configurable generation interval
   - Direct ClickHouse integration

3. **ETL Worker**
   - Uses Bull for job queue management
   - Processes and aggregates metrics hourly
   - Handles data cleanup tasks
   - Redis-based job scheduling

4. **Frontend Dashboard**
   - React-based UI
   - Real-time metrics visualization
   - Historical data analysis
   - Campaign performance tracking

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Redis
- ClickHouse

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/rajshiv169/ad-analytics-node.git
   cd ad-analytics-node
   ```

2. Start all services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access the components:
   - Dashboard: http://localhost:3000
   - API Documentation: http://localhost:8000
   - ClickHouse HTTP Interface: http://localhost:8123

## Development Setup

Each component can be run independently for development:

### Backend API
```bash
cd backend
npm install
npm run dev
```

### Mock Data Generator
```bash
cd mock-data
npm install
npm run dev
```

### ETL Worker
```bash
cd etl
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` file in each component directory with the following variables:

```env
# ClickHouse Configuration
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=admin
CLICKHOUSE_PASSWORD=admin123
CLICKHOUSE_DB=ad_analytics

# Redis Configuration (for ETL worker)
REDIS_URL=redis://localhost:6379

# Mock Data Generator
MOCK_DATA_INTERVAL_SECONDS=60
```

## Data Flow

1. The mock data generator creates realistic ad metrics every minute
2. Data is stored in ClickHouse's raw metrics table
3. ETL worker processes the data hourly:
   - Aggregates metrics by campaign and hour
   - Calculates derived metrics (CTR, CPC, etc.)
   - Stores results in aggregated tables
4. Backend API serves both real-time and aggregated data
5. Frontend dashboard visualizes the metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT