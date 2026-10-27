const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
  try {
    console.log('Querying Google API for supported models...');
    const list = await ai.models.list();
    console.log('Available models:');
    for await (const model of list) {
      if (model.name.includes('flash') || model.name.includes('gemini')) {
        console.log(' -', model.name);
      }
    }
  } catch (err) {
    console.error('List models failed:', err);
  }
}

list();
