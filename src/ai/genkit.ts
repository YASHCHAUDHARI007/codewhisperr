
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq as the exclusive AI provider using the OpenAI community plugin.
 * 
 * Groq is used for its exceptional speed and high rate limits, 
 * utilizing the Llama 3.3 70B model.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
      // Explicitly register the Groq model so Genkit's registry can find it
      models: ['llama-3.3-70b-versatile'],
    }),
  ],
});

/**
 * The specific model identifier for Groq's Llama 3.3 model.
 * In the genkitx-openai plugin, custom models are prefixed with 'openai/'.
 */
export const GROQ_MODEL = 'openai/llama-3.3-70b-versatile';
