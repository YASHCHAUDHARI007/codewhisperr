
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq as the AI provider using the OpenAI plugin.
 * We use Llama 3.1 8B Instant for fast and efficient inference.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      models: ['llama-3.1-8b-instant'],
    }),
  ],
});

/**
 * The specific model identifier for Groq's Llama 3.1 8B model.
 * The 'openai/' prefix is required when using the genkitx-openai plugin.
 */
export const AI_MODEL = 'openai/llama-3.1-8b-instant';
