
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Initializes Genkit with the OpenAI plugin configured for Groq.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    }),
  ],
});

export const AI_MODEL = 'openai/llama-3.1-8b-instant';
