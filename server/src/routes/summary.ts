import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { pdfService } from '../services/pdfService';
import { geminiService } from '../services/geminiService';
import { validateStudyText, ValidationError } from '../utils/validateInput';
import { config } from '../config/env';

export const summaryRouter = Router();

// Configure Multer for in-memory PDF uploads with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadBytes,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only PDF files are supported for document upload.'));
    }
  },
});

/**
 * POST /api/summary/extract-pdf
 * Extracts readable plain text from an uploaded PDF.
 */
summaryRouter.post(
  '/extract-pdf',
  upload.single('pdf'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new ValidationError('No PDF file was uploaded. Please attach a PDF document.');
      }

      const result = await pdfService.extractText(req.file.buffer, req.file.originalname);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/summary
 * Generates an executive summary, core key concepts, and high-yield revision points.
 */
summaryRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const text = validateStudyText(req.body.text, 'text');
      const title = typeof req.body.title === 'string' ? req.body.title.trim() : undefined;

      const summary = await geminiService.generateSummary(text, title);
      res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  }
);
