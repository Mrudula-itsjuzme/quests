import { Router } from 'express';

export function createUserRoutes(services) {
  const router = Router();
  const { assignmentService, campaignService } = services;

  // Middleware to ensure user is authenticated
  router.use((req, res, next) => {
    if (!req.identity?.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    next();
  });

  // My Quests
  router.get('/my-quests', async (req, res, next) => {
    try {
      const active = await assignmentService.getActiveAssignments(req.identity.id);
      res.json(active);
    } catch (err) { next(err); }
  });

  router.post('/my-quests/:id/complete', async (req, res, next) => {
    try {
      // In a real app we might pass proof and use VerificationService here
      // For this simplified route, we just assume completion adds full progress
      // The old system used a target value, we can just pass an arbitrary high number
      // or ideally we look up the target value and pass it. We'll pass 1 for simple tasks.
      const progress = req.body.progress || 1; 
      const result = await assignmentService.updateProgress(req.params.id, progress);
      res.json(result);
    } catch (err) { next(err); }
  });

  // Campaigns
  router.get('/campaigns', async (req, res, next) => {
    try {
      const campaigns = await campaignService.listActiveCampaigns();
      res.json(campaigns);
    } catch (err) { next(err); }
  });

  // Community Events
  router.get('/events', async (req, res, next) => {
    // Placeholder
    res.json([]);
  });

  router.get('/community', async (req, res, next) => {
    // Placeholder for community goals
    res.json({ communityGoals: [] });
  });

  return router;
}
