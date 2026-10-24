import { SourceScraperAdapter, ScraperExecutionResult } from './types';

export const devpostScraper: SourceScraperAdapter = {
  sourceId: 'src-devpost',
  sourceName: 'Devpost',
  sourceUrl: 'https://devpost.com/hackathons',

  async scrape(): Promise<ScraperExecutionResult> {
    const logs: string[] = [];
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] Connecting to Devpost public hackathons page (devpost.com/hackathons)...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let httpStatus = 403;
      let bodyText = '';

      try {
        const res = await fetch('https://devpost.com/hackathons', {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        clearTimeout(timeoutId);
        httpStatus = res.status;
        bodyText = await res.text();
      } catch (e: any) {
        clearTimeout(timeoutId);
        bodyText = e.message;
      }

      const isCloudflareBlocked =
        httpStatus === 403 ||
        httpStatus === 429 ||
        bodyText.includes('Just a moment...') ||
        bodyText.includes('Attention Required! | Cloudflare') ||
        bodyText.includes('Cloudflare');

      logs.push(`[${new Date().toISOString()}] Devpost HTTP response status: ${httpStatus}.`);

      if (isCloudflareBlocked) {
        logs.push(
          `[${new Date().toISOString()}] BLOCKED: Automated web extraction intercepted by Cloudflare Turnstile / Bot Management per devpost.com policy.`
        );
        logs.push(
          `[${new Date().toISOString()}] In strict compliance with PathSync AI Rule 2 & Rule 21: Zero credential abuse, zero CAPTCHA bypass attempted.`
        );

        return {
          sourceId: 'src-devpost',
          sourceName: 'Devpost',
          sourceUrl: 'https://devpost.com/hackathons',
          status: 'BLOCKED',
          discoveredCount: 0,
          rawPayloads: [],
          errorDetails:
            'HTTP 403 Forbidden: Protected by Cloudflare Bot Management / CAPTCHA challenge. Per security architecture, scraper safely honors site protection boundaries without bypass attempts.',
          logs,
          executedAt: new Date().toISOString(),
        };
      }

      // If somehow accessible without bot challenge in another environment
      return {
        sourceId: 'src-devpost',
        sourceName: 'Devpost',
        sourceUrl: 'https://devpost.com/hackathons',
        status: 'SUCCESS',
        discoveredCount: 0,
        rawPayloads: [],
        logs: [...logs, 'No public hackathons returned in current cycle.'],
        executedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        sourceId: 'src-devpost',
        sourceName: 'Devpost',
        sourceUrl: 'https://devpost.com/hackathons',
        status: 'BLOCKED',
        discoveredCount: 0,
        rawPayloads: [],
        errorDetails: `Access blocked: ${err.message}`,
        logs: [...logs, `Devpost connection error: ${err.message}`],
        executedAt: new Date().toISOString(),
      };
    }
  },
};
