import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);
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

app.listen(port, () => {
  console.log(`jj-mgmt-api listening on http://localhost:${port}`);
});
