import { SourceScraperAdapter, ScraperExecutionResult } from './types';
import { unstopScraper } from './unstopScraper';
import { istiScraper } from './istiScraper';
import { anrfScraper } from './anrfScraper';
import { nptelScraper } from './nptelScraper';
import { ugcScraper } from './ugcScraper';
import { swayamScraper } from './swayamScraper';
import { aicteScraper } from './aicteScraper';
import { nspScraper } from './nspScraper';
import { devpostScraper } from './devpostScraper';

export * from './types';
export * from './detailLinkExtractor';
export {
  unstopScraper,
  istiScraper,
  anrfScraper,
  nptelScraper,
  ugcScraper,
  swayamScraper,
  aicteScraper,
  nspScraper,
  devpostScraper,
};

export const ALL_SOURCE_SCRAPERS: Record<string, SourceScraperAdapter> = {
  'src-nsp': nspScraper,
  'src-ugc': ugcScraper,
  'src-aicte': aicteScraper,
  'src-isti': istiScraper,
  'src-anrf': anrfScraper,
  'src-unstop': unstopScraper,
  'src-devpost': devpostScraper,
  'src-nptel': nptelScraper,
  'src-swayam': swayamScraper,
};

/**
 * Runs a single source scraper by sourceId
 */
export async function runScraperForSource(sourceId: string): Promise<ScraperExecutionResult> {
  const scraper = ALL_SOURCE_SCRAPERS[sourceId];
  if (!scraper) {
    return {
      sourceId,
      sourceName: sourceId,
      sourceUrl: '',
      status: 'ERROR',
      discoveredCount: 0,
      rawPayloads: [],
      errorDetails: `No scraper adapter found registered for source ID: ${sourceId}`,
      logs: [`Error: Source adapter for ${sourceId} is not registered.`],
      executedAt: new Date().toISOString(),
    };
  }
  return await scraper.scrape();
}

/**
 * Runs all 9 source scrapers in parallel or sequence with isolated failure handling.
 * A failure in one source does NOT halt or abort the remaining sources!
 */
export async function runScrapersForAllSources(): Promise<Record<string, ScraperExecutionResult>> {
  const results: Record<string, ScraperExecutionResult> = {};
  const scraperEntries = Object.entries(ALL_SOURCE_SCRAPERS);

  for (const [sourceId, scraper] of scraperEntries) {
    try {
      const res = await scraper.scrape();
      results[sourceId] = res;
    } catch (err: any) {
      results[sourceId] = {
        sourceId,
        sourceName: scraper.sourceName,
        sourceUrl: scraper.sourceUrl,
        status: 'ERROR',
        discoveredCount: 0,
        rawPayloads: [],
        errorDetails: err.message,
        logs: [`Isolated scraper error in ${scraper.sourceName}: ${err.message}`],
        executedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}
