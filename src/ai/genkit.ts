import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq as the exclusive AI provider.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
  ],
});

/**
 * The specific model identifier for Groq's Llama 3.1 8B model via the OpenAI plugin.
 */
export const AI_MODEL = 'openai/llama-3.1-8b-instant';
