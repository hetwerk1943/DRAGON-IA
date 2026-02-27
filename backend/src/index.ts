import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import toolRoutes from './routes/tools';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dragon-ai-gateway', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  logger.info(`🐉 Dragon AI Gateway running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
