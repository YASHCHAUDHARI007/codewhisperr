
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openai } from 'genkitx-openai';

/**
 * Initializes Genkit with multiple AI providers.
 * 
 * We use Groq (via the OpenAI plugin) as the primary provider for its speed 
 * and high rate limits, especially for Llama 3.3 70B.
 * 
 * Google AI remains available as a fallback.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
    }),
    openai({
      name: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
  ],
  // Default to Groq's high-performance Llama 3.3 model
  model: 'groq/llama-3.3-70b-versatile',
});
