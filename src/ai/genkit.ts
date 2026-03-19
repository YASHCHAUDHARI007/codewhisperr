
import OpenAI from 'openai';

/**
 * Initializes the OpenAI client configured for Groq.
 * This direct SDK approach bypasses Genkit registry resolution issues.
 */
export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

/**
 * The specific model identifier for Groq.
 */
export const AI_MODEL = 'llama-3.1-8b-instant';
