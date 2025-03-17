import express from 'express';
import cors from 'cors';
import { createClient } from '@clickhouse/client';
import { config } from 'dotenv';
import { MetricsController } from './controllers/MetricsController';
import { ClickHouseService } from './services/ClickHouseService';

config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ClickHouse client
const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'admin',
  password: process.env.CLICKHOUSE_PASSWORD || 'admin123',
  database: process.env.CLICKHOUSE_DB || 'ad_analytics'
});

// Initialize services and controllers
const clickhouseService = new ClickHouseService(clickhouse);
const metricsController = new MetricsController(clickhouseService);

// Initialize database
async function initializeDatabase() {
  try {
    await clickhouse.exec({
      query: `CREATE DATABASE IF NOT EXISTS ad_analytics`
    });

    await clickhouse.exec({
      query: `
        CREATE TABLE IF NOT EXISTS ad_analytics.ad_metrics (
          timestamp DateTime,
          campaign_id String,
          ad_id String,
          impressions UInt32,
          clicks UInt32,
          conversions UInt32,
          spend Float64,
          ctr Float64 MATERIALIZED clicks / impressions,
          cpc Float64 MATERIALIZED spend / clicks,
          date Date MATERIALIZED toDate(timestamp)
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (timestamp, campaign_id, ad_id)
      `
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Ad Analytics API is running' });
});

app.get('/metrics/summary', metricsController.getSummary);
app.get('/metrics/realtime', metricsController.getRealtime);

// Initialize database on startup
initializeDatabase();

export default app;