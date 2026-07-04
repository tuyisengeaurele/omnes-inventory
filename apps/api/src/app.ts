import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { prisma } from './db.js';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { teamRouter } from './routes/team.js';
import { productsRouter } from './routes/products.js';
import { categoriesRouter } from './routes/categories.js';
import { catalogIoRouter } from './routes/catalog-io.js';
import { errorHandler } from './lib/errors.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', db: 'down' });
    }
  });

  app.use('/auth', authRouter);
  app.use('/team', teamRouter);
  app.use('/products', productsRouter);
  app.use('/categories', categoriesRouter);
  app.use('/catalog', catalogIoRouter);
  app.use('/uploads', express.static(env.uploadDir));

  app.use((_req, res) => res.status(404).json({ error: 'not found' }));
  app.use(errorHandler);

  return app;
}
