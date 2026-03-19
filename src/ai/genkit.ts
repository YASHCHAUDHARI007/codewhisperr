
import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * Initializes Genkit with Groq as the exclusive AI provider using the OpenAI community plugin.
 * 
 * Groq is used for its exceptional speed and high rate limits, 
 * utilizing the Llama 3.3 70B model.
 */
export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
  ],
  // Using Groq's high-performance Llama 3.3 model
  // The genkitx-openai plugin prefixes models with 'openai/'
  model: 'openai/llama-3.3-70b-versatile',
});
