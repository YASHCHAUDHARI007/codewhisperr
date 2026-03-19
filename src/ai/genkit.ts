import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq as the exclusive AI provider.
 * 
 * Groq is used for its exceptional speed and high rate limits, 
 * utilizing the Llama 3.3 70B model via the OpenAI-compatible plugin.
 */
export const ai = genkit({
  plugins: [
    openai({
      name: 'groq',
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
  ],
  // Use Groq's high-performance Llama 3.3 model as the default
  model: 'groq/llama-3.3-70b-versatile',
});
