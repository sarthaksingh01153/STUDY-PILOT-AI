/**
 * Request validation utilities.
 * Ensures incoming user data is well-formed, within safe limits, and non-empty.
 */

import { config } from '../config/env';

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

/**
 * Validates and trims text input for AI processing.
 */
export function validateStudyText(text: unknown, fieldName = 'text'): string {
  if (typeof text !== 'string') {
    throw new ValidationError(`Field '${fieldName}' must be a string.`);
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`Field '${fieldName}' cannot be empty.`);
  }

  if (trimmed.length > config.maxTextChars) {
    throw new ValidationError(
      `Text exceeds maximum allowed length of ${config.maxTextChars.toLocaleString()} characters (received ${trimmed.length.toLocaleString()}).`
    );
  }

  return trimmed;
}

/**
 * Validates question count for quiz generation.
 */
export function validateQuestionCount(count: unknown, defaultCount = 5): number {
  if (count === undefined || count === null) {
    return defaultCount;
  }

  const parsed = Number(count);
  if (isNaN(parsed) || parsed < 1 || parsed > 15) {
    throw new ValidationError('Question count must be a number between 1 and 15.');
  }

  return Math.floor(parsed);
}

/**
 * Validates chat message content.
 */
export function validateChatMessage(message: unknown): string {
  if (typeof message !== 'string') {
    throw new ValidationError('Message must be a string.');
  }
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('Message cannot be empty.');
  }
  if (trimmed.length > 2000) {
    throw new ValidationError('Message cannot exceed 2,000 characters.');
  }
  return trimmed;
}

/**
 * Validates study plan request parameters.
 */
export function validateDailyMinutes(minutes: unknown, defaultMinutes = 60): number {
  if (minutes === undefined || minutes === null) {
    return defaultMinutes;
  }
  const parsed = Number(minutes);
  if (isNaN(parsed) || parsed < 15 || parsed > 720) {
    throw new ValidationError('Daily available study time must be between 15 and 720 minutes (12 hours).');
  }
  return Math.floor(parsed);
}
