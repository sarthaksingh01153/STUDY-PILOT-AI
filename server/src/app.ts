import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { summaryRouter } from './routes/summary';
import { quizRouter } from './routes/quiz';
import { tutorRouter } from './routes/tutor';
import { studyPlanRouter } from './routes/studyPlan';

export function createApp(): Application {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: config.nodeEnv === 'production' ? config.clientOrigin : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // In-memory rate limiting to protect API quota
  app.use(rateLimiter);

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      geminiConfigured: config.isGeminiConfigured,
      model: config.geminiModel,
      message: config.isGeminiConfigured
        ? 'Gemini API is active and ready.'
        : 'Server is running, but GEMINI_API_KEY is missing from server/.env.',
    });
  });

  // Mount API modules
  app.use('/api/summary', summaryRouter);
  app.use('/api/quiz', quizRouter);
  app.use('/api/tutor', tutorRouter);
  app.use('/api/study-plan', studyPlanRouter);

  // Fallback 404 handler for unknown routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
