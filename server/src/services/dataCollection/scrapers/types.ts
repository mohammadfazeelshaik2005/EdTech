import { RawOpportunityPayload, ScraperStatus } from '@/types/dataCollection';

export interface ScraperExecutionResult {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  status: ScraperStatus;
  discoveredCount: number;
  rawPayloads: RawOpportunityPayload[];
  errorDetails?: string;
  logs: string[];
  executedAt: string;
}

export interface SourceScraperAdapter {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  scrape(options?: { allowLiveNetwork?: boolean }): Promise<ScraperExecutionResult>;
}
