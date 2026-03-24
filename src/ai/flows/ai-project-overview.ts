
'use server';
/**
 * @fileOverview Parallel AI analysis for project overviews.
 * Returns summary, tech stack, architecture, and a Mermaid flowchart.
 */

import { ai, AI_MODEL } from '@/ai/genkit';
import { z } from 'zod';

const AiProjectOverviewOutputSchema = z.object({
  summary: z.string().describe("High-level summary of purpose."),
  techStack: z.array(z.string()).describe('Core technologies detected.'),
  architecture: z.string().describe("Step-by-step architectural breakdown."),
  bugs: z.array(z.string()).describe("Potential inefficiencies or bugs detected."),
  mermaidFlowchart: z.string().describe("Mermaid syntax for a flowchart of the project logic."),
});

export type AiProjectOverviewOutput = z.infer<typeof AiProjectOverviewOutputSchema>;

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes('429') || error?.message?.includes('500')) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function aiProjectOverview(input: { codebaseContent: string }): Promise<AiProjectOverviewOutput> {
  return aiProjectOverviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProjectOverviewPrompt',
  input: { schema: z.object({ codebaseContent: z.string() }) },
  output: { schema: AiProjectOverviewOutputSchema },
  config: { model: AI_MODEL },
  prompt: `You are a senior software architect. Analyze the provided codebase and return a detailed, structured analysis.

Focus on:
1. What the code does (Summary)
2. The primary frameworks and libraries (Tech Stack)
3. Step-by-step logic flow (Architecture)
4. Potential issues or performance bottlenecks (Bugs)
5. A visual representation of the main flow in Mermaid syntax (Mermaid Flowchart)

Codebase Context:
{{{codebaseContent}}}`,
});

const aiProjectOverviewFlow = ai.defineFlow(
  {
    name: 'aiProjectOverviewFlow',
    inputSchema: z.object({ codebaseContent: z.string() }),
    outputSchema: AiProjectOverviewOutputSchema,
  },
  async (input) => {
    const { output } = await callWithRetry(() => prompt(input));
    return output!;
  }
);
