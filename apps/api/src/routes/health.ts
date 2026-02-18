import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'jj-mgmt-api',
    timestamp: new Date().toISOString(),
  });
});
