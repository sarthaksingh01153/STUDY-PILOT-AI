import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory bucket store: ip -> { count, resetTime }
const ipBuckets = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 40; // 40 requests per minute per IP

/**
 * Clean in-memory sliding window rate limiter.
 * Automatically cleans expired IP entries to avoid memory leaks.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Allow health check without throttling
  if (req.path === '/api/health') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = ipBuckets.get(ip);

  if (!record || now > record.resetTime) {
    ipBuckets.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return next();
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      error: `Too many requests. Please wait ${retryAfter} second(s) before trying again.`,
    });
    return;
  }

  record.count += 1;
  next();
}

// Periodic cleanup of stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipBuckets.entries()) {
    if (now > record.resetTime) {
      ipBuckets.delete(ip);
    }
  }
}, 5 * 60 * 1000);
