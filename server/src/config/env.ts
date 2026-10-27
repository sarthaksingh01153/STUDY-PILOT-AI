import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also attempt default fallback
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  geminiApiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  isGeminiConfigured: Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim().length > 0 &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ),
  maxUploadBytes: 10 * 1024 * 1024, // 10MB
  maxTextChars: 50000,
};
