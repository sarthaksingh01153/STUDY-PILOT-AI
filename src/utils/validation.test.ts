import { describe, it, expect } from 'vitest';
import {
  validateStudyText,
  validateQuestionCount,
  validateChatMessage,
  validateDailyMinutes,
  ValidationError,
} from '../../server/src/utils/validateInput';

describe('Server Request Validation Utilities', () => {
  it('accepts valid study text and trims whitespace', () => {
    const text = '   Valid computer science study notes   ';
    expect(validateStudyText(text)).toBe('Valid computer science study notes');
  });

  it('rejects empty or whitespace-only strings with ValidationError', () => {
    expect(() => validateStudyText('')).toThrow(ValidationError);
    expect(() => validateStudyText('    ')).toThrow(ValidationError);
  });

  it('validates question count within safe range [1, 15]', () => {
    expect(validateQuestionCount(5)).toBe(5);
    expect(validateQuestionCount('8')).toBe(8);
    expect(() => validateQuestionCount(0)).toThrow(ValidationError);
    expect(() => validateQuestionCount(20)).toThrow(ValidationError);
  });

  it('validates chat message length and rejects blanks', () => {
    expect(validateChatMessage('What is paging?')).toBe('What is paging?');
    expect(() => validateChatMessage('')).toThrow(ValidationError);
    expect(() => validateChatMessage('a'.repeat(2500))).toThrow(ValidationError);
  });

  it('validates daily available study minutes [15, 720]', () => {
    expect(validateDailyMinutes(45)).toBe(45);
    expect(() => validateDailyMinutes(5)).toThrow(ValidationError);
    expect(() => validateDailyMinutes(900)).toThrow(ValidationError);
  });
});
