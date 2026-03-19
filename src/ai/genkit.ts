import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq (or OpenAI-compatible provider) as the exclusive AI provider.
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
 * The specific model identifier for the requested model.
 */
export const AI_MODEL = 'openai/gpt-oss-120b';
