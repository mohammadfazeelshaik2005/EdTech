import { Router, Request, Response } from 'express';
import {
  getActiveVerifiedOpportunities,
  getOpportunityById,
  getAllOpportunitiesForAdmin,
} from '../services/dataCollection/index.js';

export const opportunitiesRouter = Router();

/**
 * GET /api/opportunities
 * Returns verified, non-expired opportunities
 */
opportunitiesRouter.get('/', (_req: Request, res: Response) => {
  try {
    const opps = getActiveVerifiedOpportunities();
    res.json({
      ok: true,
      count: opps.length,
      data: opps,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to fetch opportunities.',
    });
  }
});

/**
 * GET /api/opportunities/all
 * Returns all opportunities including inactive (admin use)
 */
opportunitiesRouter.get('/all', (_req: Request, res: Response) => {
  try {
    const opps = getAllOpportunitiesForAdmin();
    res.json({
      ok: true,
      count: opps.length,
      data: opps,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to fetch all opportunities.',
    });
  }
});

/**
 * GET /api/opportunities/:id
 * Returns a specific opportunity by ID
 */
opportunitiesRouter.get('/:id', (req: Request, res: Response): void => {
  try {
    const oppId = String(req.params.id);
    const opp = getOpportunityById(oppId);
    if (!opp) {
      res.status(404).json({
        ok: false,
        error: `Opportunity with id "${oppId}" not found.`,
      });
      return;
    }
    res.json({
      ok: true,
      data: opp,
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      error: err.message || 'Failed to fetch opportunity.',
    });
  }
});
