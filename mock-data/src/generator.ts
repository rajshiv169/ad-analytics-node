import { createClient } from '@clickhouse/client';
import { config } from 'dotenv';

config();

interface AdMetric {
  timestamp: Date;
  campaign_id: string;
  ad_id: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

class AdMetricsGenerator {
  private campaigns: string[];
  private adsPerCampaign: number;
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.campaigns = Array.from({ length: 5 }, (_, i) => `campaign_${i + 1}`);
    this.adsPerCampaign = 5;
    this.client = createClient({
      host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER || 'admin',
      password: process.env.CLICKHOUSE_PASSWORD || 'admin123',
      database: process.env.CLICKHOUSE_DB || 'ad_analytics'
    });
  }

  private generateMetrics(timestamp: Date): AdMetric[] {
    const metrics: AdMetric[] = [];

    for (const campaignId of this.campaigns) {
      for (let adNum = 0; adNum < this.adsPerCampaign; adNum++) {
        const adId = `${campaignId}_ad_${adNum}`;

        // Generate realistic metrics
        const impressions = Math.floor(Math.random() * 9000) + 1000;
        // Click-through rate between 0.5% and 5%
        const clicks = Math.floor(impressions * (Math.random() * 0.045 + 0.005));
        // Conversion rate between 1% and 10% of clicks
        const conversions = Math.floor(clicks * (Math.random() * 0.09 + 0.01));
        // Cost per click between $0.5 and $2
        const spend = Number((clicks * (Math.random() * 1.5 + 0.5)).toFixed(2));

        metrics.push({
          timestamp,
          campaign_id: campaignId,
          ad_id: adId,
          impressions,
          clicks,
          conversions,
          spend
        });
      }
    }

    return metrics;
  }

  async insertMetrics(metrics: AdMetric[]) {
    try {
      await this.client.insert({
        table: 'ad_metrics',
        values: metrics,
        format: 'JSONEachRow'
      });
      console.log(`Inserted ${metrics.length} metrics at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error inserting metrics:', error);
    }
  }

  async start(intervalSeconds: number = 60) {
    console.log(`Starting mock data generation with ${intervalSeconds} seconds interval`);
    
    const generateAndInsert = async () => {
      const metrics = this.generateMetrics(new Date());
      await this.insertMetrics(metrics);
    };

    // Generate initial data
    await generateAndInsert();

    // Set up interval for continuous generation
    setInterval(generateAndInsert, intervalSeconds * 1000);
  }
}

// Start the generator if this file is run directly
if (require.main === module) {
  const intervalSeconds = parseInt(process.env.MOCK_DATA_INTERVAL_SECONDS || '60', 10);
  const generator = new AdMetricsGenerator();
  generator.start(intervalSeconds).catch(console.error);
}