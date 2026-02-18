import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';

export const createApp = () => {
  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:8081';

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      service: 'jj-mgmt-api',
      status: 'running',
    });
  });

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);

  return app;
};
