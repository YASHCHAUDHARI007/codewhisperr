'use server';
/**
 * @fileOverview An interactive AI chat agent for codebase queries.
 */

import { ai, AI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const InteractiveAiChatInputSchema = z.object({
  query: z.string().describe("The user's question."),
  codebaseContent: z.string().describe('The codebase context.'),
});
export type InteractiveAiChatInput = z.infer<typeof InteractiveAiChatInputSchema>;

const InteractiveAiChatOutputSchema = z.object({
  answer: z.string().describe("The AI's answer."),
});
export type InteractiveAiChatOutput = z.infer<typeof InteractiveAiChatOutputSchema>;

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function interactiveAiChat(input: InteractiveAiChatInput): Promise<InteractiveAiChatOutput> {
  return callWithRetry(() => interactiveAiChatFlow(input));
}

const interactiveAiChatFlow = ai.defineFlow(
  {
    name: 'interactiveAiChatFlow',
    inputSchema: InteractiveAiChatInputSchema,
    outputSchema: InteractiveAiChatOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'openai/llama3-8b-8192',
      prompt: `You are an AI assistant helping a developer understand their codebase. Answer the user's question accurately based on the provided context.

      Context:
      ${input.codebaseContent}

      User Question:
      ${input.query}`,
      output: { schema: InteractiveAiChatOutputSchema },
    });

    if (!output) throw new Error('AI failed to respond to query.');
    return output;
  }
);
