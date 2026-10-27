import { Router, Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/geminiService';
import { validateChatMessage } from '../utils/validateInput';

export const tutorRouter = Router();

/**
 * POST /api/tutor/stream
 * Server-Sent Events (SSE) streaming endpoint for instantaneous, progressive tutor chat responses.
 */
tutorRouter.post(
  '/stream',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const message = validateChatMessage(req.body.message);
      const notesContext = typeof req.body.notesContext === 'string' ? req.body.notesContext : '';
      const history = Array.isArray(req.body.history) ? req.body.history : [];

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in proxies/Nginx
      res.flushHeaders?.();

      const controller = new AbortController();
      res.on('close', () => {
        if (!res.writableEnded) {
          controller.abort();
        }
      });

      await geminiService.streamTutorReply(
        message,
        notesContext,
        history,
        (chunk: string) => {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        },
        controller.signal
      );

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Tutor streaming error';
      // If headers were already sent, send error via SSE
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  }
);

/**
 * POST /api/tutor
 * Standard non-streaming endpoint fallback.
 */
tutorRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const message = validateChatMessage(req.body.message);
      const notesContext = typeof req.body.notesContext === 'string' ? req.body.notesContext : '';
      const history = Array.isArray(req.body.history) ? req.body.history : [];

      const reply = await geminiService.askTutor(message, notesContext, history);
      res.status(200).json(reply);
    } catch (err) {
      next(err);
    }
  }
);
