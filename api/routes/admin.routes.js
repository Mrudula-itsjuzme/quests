import { Router } from 'express';

export function createAdminRoutes(services) {
  const router = Router();
  const { questService, campaignService, assignmentService } = services;

  // Middleware to ensure admin
  router.use((req, res, next) => {
    if (!req.identity?.isAdmin) {
      return res.status(403).json({ error: 'admin_required' });
    }
    next();
  });

  // Quests
  router.post('/quests', async (req, res, next) => {
    try {
      const quest = await questService.createQuest(req.body, req.identity.id);
      res.status(201).json(quest);
    } catch (err) { next(err); }
  });

  router.put('/quests/:id', async (req, res, next) => {
    try {
      const quest = await questService.updateQuest(req.params.id, req.body);
      res.json(quest);
    } catch (err) { next(err); }
  });

  router.delete('/quests/:id', async (req, res, next) => {
    try {
      await questService.archiveQuest(req.params.id);
      res.status(204).end();
    } catch (err) { next(err); }
  });

  // Campaigns
  router.post('/campaigns', async (req, res, next) => {
    try {
      const campaign = await campaignService.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (err) { next(err); }
  });

  router.post('/campaigns/:id/launch', async (req, res, next) => {
    try {
      await campaignService.launchCampaign(req.params.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  });

  // Assignments
  router.post('/assign', async (req, res, next) => {
    try {
      const { userId, questTemplateId, expiresAt } = req.body;
      const assignment = await assignmentService.assignQuest(userId, questTemplateId, expiresAt);
      res.status(201).json(assignment);
    } catch (err) { next(err); }
  });

  // Analytics
  router.get('/analytics', async (req, res, next) => {
    // Placeholder for analytics logic
    res.json({ stats: 'Not Implemented' });
  });

  return router;
}
