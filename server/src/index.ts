import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 StudyPilot AI Express Server running on port ${config.port}`);
  console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`🤖 Gemini Status: ${config.isGeminiConfigured ? 'CONNECTED' : 'MISSING API KEY in server/.env'}`);
  console.log(`🧠 Model: ${config.geminiModel}`);
  console.log(`=======================================================`);
});
