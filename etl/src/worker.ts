import Bull from 'bull';
import { createClient } from '@clickhouse/client';
import { config } from 'dotenv';
import { subHours, format } from 'date-fns';

config();

// Initialize Bull queue
const metricsQueue = new Bull('metrics-processing', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Initialize ClickHouse client
const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER || 'admin',
  password: process.env.CLICKHOUSE_PASSWORD || 'admin123',
  database: process.env.CLICKHOUSE_DB || 'ad_analytics'
});

interface ProcessMetricsJob {
  startTime: string;
  endTime: string;
}

interface CleanupJob {
  daysToKeep: number;
}

// Process metrics job
metricsQueue.process('process-metrics', async (job) => {
  const { startTime, endTime } = job.data as ProcessMetricsJob;

  try {
    // Fetch and aggregate metrics
    const query = `
      SELECT
        toStartOfHour(timestamp) as hour,
        campaign_id,
        sum(impressions) as total_impressions,
        sum(clicks) as total_clicks,
        sum(conversions) as total_conversions,
        sum(spend) as total_spend,
        round(avg(ctr) * 100, 2) as avg_ctr,
        round(avg(cpc), 2) as avg_cpc
      FROM ad_analytics.ad_metrics
      WHERE timestamp BETWEEN {start_time:DateTime} AND {end_time:DateTime}
      GROUP BY hour, campaign_id
    `;

    const resultSet = await clickhouse.query({
      query,
      format: 'JSONEachRow',
      parameters: {
        start_time: startTime,
        end_time: endTime
      }
    });

    const results = await resultSet.json();

    // Store aggregated results
    await clickhouse.insert({
      table: 'hourly_metrics',
      values: results,
      format: 'JSONEachRow'
    });

    return {
      success: true,
      message: `Processed metrics from ${startTime} to ${endTime}`,
      recordsProcessed: results.length
    };
  } catch (error) {
    console.error('Error processing metrics:', error);
    throw error;
  }
});

// Cleanup old data job
metricsQueue.process('cleanup-data', async (job) => {
  const { daysToKeep } = job.data as CleanupJob;

  try {
    const cutoffDate = format(subHours(new Date(), 24 * daysToKeep), 'yyyy-MM-dd HH:mm:ss');

    await clickhouse.exec({
      query: `
        ALTER TABLE ad_analytics.ad_metrics
        DELETE WHERE timestamp < {cutoff_date:DateTime}
      `,
      parameters: {
        cutoff_date: cutoffDate
      }
    });

    return {
      success: true,
      message: `Cleaned up data older than ${cutoffDate}`
    };
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    throw error;
  }
});

// Schedule recurring jobs
async function scheduleJobs() {
  // Process metrics every hour
  await metricsQueue.add(
    'process-metrics',
    {
      startTime: format(subHours(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
      endTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    },
    {
      repeat: {
        cron: '0 * * * *' // Every hour
      }
    }
  );

  // Clean up old data weekly
  await metricsQueue.add(
    'cleanup-data',
    {
      daysToKeep: 90
    },
    {
      repeat: {
        cron: '0 0 * * 0' // Every Sunday at midnight
      }
    }
  );
}

// Start scheduling jobs
scheduleJobs().catch(console.error);

// Handle queue events
metricsQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed:`, job.returnvalue);
});

metricsQueue.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await metricsQueue.close();
  process.exit(0);
});