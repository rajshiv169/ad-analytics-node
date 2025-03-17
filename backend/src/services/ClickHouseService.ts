import { ClickHouseClient } from '@clickhouse/client';

export class ClickHouseService {
  constructor(private client: ClickHouseClient) {}

  async getMetricsSummary(
    startDate?: string,
    endDate?: string,
    campaignId?: string
  ) {
    let query = `
      SELECT
        toDate(timestamp) as date,
        campaign_id,
        sum(impressions) as total_impressions,
        sum(clicks) as total_clicks,
        sum(conversions) as total_conversions,
        sum(spend) as total_spend,
        round(avg(ctr) * 100, 2) as avg_ctr,
        round(avg(cpc), 2) as avg_cpc
      FROM ad_analytics.ad_metrics
      WHERE 1=1
    `;

    const params: Record<string, any> = {};

    if (startDate) {
      query += " AND timestamp >= {start_date:DateTime}";
      params.start_date = startDate;
    }

    if (endDate) {
      query += " AND timestamp <= {end_date:DateTime}";
      params.end_date = endDate;
    }

    if (campaignId) {
      query += " AND campaign_id = {campaign_id:String}";
      params.campaign_id = campaignId;
    }

    query += `
      GROUP BY date, campaign_id
      ORDER BY date DESC
    `;

    const resultSet = await this.client.query({
      query,
      format: 'JSONEachRow',
      parameters: params
    });

    return await resultSet.json();
  }

  async getRealtimeMetrics(windowMinutes: number = 5) {
    const query = `
      SELECT
        toStartOfMinute(timestamp) as minute,
        sum(impressions) as impressions,
        sum(clicks) as clicks,
        sum(conversions) as conversions,
        sum(spend) as spend,
        round(avg(ctr) * 100, 2) as avg_ctr
      FROM ad_analytics.ad_metrics
      WHERE timestamp >= now() - INTERVAL {window:UInt32} MINUTE
      GROUP BY minute
      ORDER BY minute DESC
    `;

    const resultSet = await this.client.query({
      query,
      format: 'JSONEachRow',
      parameters: {
        window: windowMinutes
      }
    });

    return await resultSet.json();
  }

  async insertMetrics(metrics: any[]) {
    const query = `
      INSERT INTO ad_analytics.ad_metrics
      (timestamp, campaign_id, ad_id, impressions, clicks, conversions, spend)
      VALUES
    `;

    await this.client.insert({
      table: 'ad_metrics',
      values: metrics,
      format: 'JSONEachRow'
    });
  }
}