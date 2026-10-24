import { Router, Request, Response } from 'express';
import {
  executeDataCollectionPipeline,
  revalidateAllApplicationLinks,
  auditAllStoredOpportunities,
  INGESTION_SOURCES,
} from '../services/dataCollection/index.js';

export const pipelineRouter = Router();

/**
 * GET /api/pipeline/sources
 * Returns all configured opportunity ingestion sources
 */
pipelineRouter.get('/sources', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    sources: INGESTION_SOURCES,
  });
});

/**
 * POST /api/pipeline/run
 * Executes the full scraping and normalization pipeline
 */
pipelineRouter.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceId, isScheduled = false } = req.body || {};
    const report = await executeDataCollectionPipeline({
      sourceId,
      isScheduled,
    });
    res.json({
      ok: true,
      report,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Pipeline execution failed.',
    });
  }
});

/**
 * GET /api/pipeline/audit
 * Audits all stored opportunities against current Asia/Kolkata deadlines
 */
pipelineRouter.get('/audit', (_req: Request, res: Response) => {
  try {
    const auditResult = auditAllStoredOpportunities();
    res.json({
      ok: true,
      audit: auditResult,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Audit failed.',
    });
  }
});

/**
 * POST /api/pipeline/revalidate-links
 * Revalidates application links for opportunities
 */
pipelineRouter.post('/revalidate-links', async (_req: Request, res: Response): Promise<void> => {
  try {
    const linkResult = await revalidateAllApplicationLinks();
    res.json({
      ok: true,
      result: linkResult,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Link revalidation failed.',
    });
  }
});
