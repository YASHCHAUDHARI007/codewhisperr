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
      if (error?.message?.includes('429')) {
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
      model: AI_MODEL,
      input: {
        text: `Answer the question based on the codebase context.
        Context:
        ${input.codebaseContent}

        Question:
        ${input.query}`,
      },
      output: { schema: InteractiveAiChatOutputSchema },
    });

    if (!output) throw new Error('AI failed to respond to query.');
    return output;
  }
);
