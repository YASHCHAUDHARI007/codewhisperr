import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Initializes Genkit with the Google AI plugin.
 * Uses gemini-1.5-flash as the default model for a balance of speed and capability.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
