import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validateInput';

/**
 * Centralized Express error-handling middleware.
 * Returns clean, safe JSON error responses without leaking sensitive traces or API keys.
 */
export function errorHandler(
  err: Error | unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Check for custom validation errors (400)
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Handle Multer file upload errors
  if (err && typeof err === 'object' && 'code' in err) {
    const multerError = err as { code: string; message: string };
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'The uploaded file exceeds the 10 MB limit. Please upload a smaller PDF or paste the text directly.',
      });
      return;
    }
  }

  const errorMessage = err instanceof Error ? err.message : 'An unexpected server error occurred.';

  // Check if error is related to missing or invalid Gemini API key
  if (
    errorMessage.includes('API key') ||
    errorMessage.includes('GEMINI_API_KEY') ||
    errorMessage.includes('unauthenticated') ||
    errorMessage.includes('API_KEY_INVALID')
  ) {
    res.status(401).json({
      error: 'Google Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in server/.env with a valid key from Google AI Studio.',
    });
    return;
  }

  // Check for rate limit / quota exhaustion from Google API
  if (
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorMessage.includes('Quota exceeded') ||
    errorMessage.includes('429')
  ) {
    res.status(429).json({
      error: 'Google Gemini rate limit or quota exceeded. Please wait a moment before trying again.',
    });
    return;
  }

  // Safe logging in server terminal (no user credentials)
  console.error('[StudyPilot Server Error]:', errorMessage);

  res.status(500).json({
    error: errorMessage,
  });
}
