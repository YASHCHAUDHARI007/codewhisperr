'use server';
/**
 * @fileOverview Parallel AI analysis for project overviews.
 * Returns comprehensive metrics including summary, confidence, and optimization tips.
 */

import { ai, AI_MODEL } from '@/ai/genkit';
import { z } from 'zod';

const AiProjectOverviewOutputSchema = z.object({
  summary: z.string().describe("High-level professional summary of the project purpose."),
  techStack: z.array(z.string()).describe('Core technologies and frameworks detected.'),
  architecture: z.string().describe("Structured architectural breakdown of the codebase."),
  bugs: z.array(z.string()).describe("Potential bugs, security vulnerabilities, or inefficiencies."),
  optimizationTips: z.array(z.string()).describe("Actionable performance or structure improvements."),
  confidenceScore: z.number().min(0).max(100).describe("AI confidence score in its own analysis (0-100)."),
  suggestionsCount: z.number().describe("Number of potential improvements identified."),
  languages: z.array(z.string()).describe("Primary programming languages detected."),
  mermaidFlowchart: z.string().describe("Mermaid syntax flowchart of the project logic."),
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
  prompt: `You are a professional software architect. Analyze the provided codebase and return a structured, productivity-focused analysis.

Focus on:
1. Executive Summary: What does this codebase actually do?
2. Tech Stack: Primary frameworks, languages, and libraries.
3. Architecture: How is the logic structured?
4. Technical Debt/Bugs: Security flaws or logic bugs.
5. Optimization: Suggestions for performance or readability.
6. Metrics: Confidence score, suggestion count, and primary languages.
7. Visualization: A Mermaid flowchart representing the main system flow.

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