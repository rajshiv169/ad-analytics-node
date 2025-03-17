import { Request, Response } from 'express';
import { ClickHouseService } from '../services/ClickHouseService';

export class MetricsController {
  constructor(private clickhouseService: ClickHouseService) {}

  getSummary = async (req: Request, res: Response) => {
    try {
      const { start_date, end_date, campaign_id } = req.query;
      const result = await this.clickhouseService.getMetricsSummary(
        start_date as string,
        end_date as string,
        campaign_id as string
      );
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error fetching metrics summary:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch metrics summary' 
      });
    }
  };

  getRealtime = async (req: Request, res: Response) => {
    try {
      const windowMinutes = parseInt(req.query.window_minutes as string) || 5;
      const result = await this.clickhouseService.getRealtimeMetrics(windowMinutes);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch realtime metrics' 
      });
    }
  };
}