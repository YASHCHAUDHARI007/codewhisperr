
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq as the AI provider using the OpenAI plugin.
 * We register both Llama and Nemotron models.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      models: ['llama-3.3-70b-versatile', 'nemotron-nano-9b-v2'],
    }),
  ],
});

/**
 * The specific model identifier for Groq's Nemotron Nano model.
 */
export const AI_MODEL = 'openai/nemotron-nano-9b-v2';
