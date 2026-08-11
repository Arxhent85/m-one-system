const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const match = envFile.match(/GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const prompt = `Return JSON with {"status": "ok"}`;
    const res = await model.generateContent(prompt);
    console.log('JSON OUTPUT SUCCESS:', res.response.text());
  } catch (e) {
    console.log('JSON OUTPUT FAIL:', e.message);
  }
}

main();
