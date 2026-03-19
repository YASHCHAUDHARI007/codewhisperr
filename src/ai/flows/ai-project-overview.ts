'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating a high-level overview of a software project.
 */

import { ai, AI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const AiProjectOverviewInputSchema = z.object({
  codebaseContent: z.string().describe('The full content of the codebase files.'),
});
export type AiProjectOverviewInput = z.infer<typeof AiProjectOverviewInputSchema>;

const AiProjectOverviewOutputSchema = z.object({
  summary: z.string().describe("A high-level summary of the project's purpose."),
  techStack: z.array(z.string()).describe('An array of technologies used.'),
  architecture: z.string().describe("An explanation of the project's overall architecture."),
});
export type AiProjectOverviewOutput = z.infer<typeof AiProjectOverviewOutputSchema>;

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('500')) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function aiProjectOverview(input: AiProjectOverviewInput): Promise<AiProjectOverviewOutput> {
  return callWithRetry(() => aiProjectOverviewFlow(input));
}

const aiProjectOverviewFlow = ai.defineFlow(
  {
    name: 'aiProjectOverviewFlow',
    inputSchema: AiProjectOverviewInputSchema,
    outputSchema: AiProjectOverviewOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: AI_MODEL,
      prompt: `You are an expert software architect. Analyze the provided codebase and return a structured overview including a summary of purpose, the tech stack, and the architecture pattern.

      Codebase:
      ${input.codebaseContent}`,
      output: { schema: AiProjectOverviewOutputSchema },
    });

    if (!output) throw new Error('AI failed to generate project overview.');
    return output;
  }
);
