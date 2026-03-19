'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating a high-level overview of a software project.
 *
 * - aiProjectOverview - A function that handles the generation of project overview.
 * - AiProjectOverviewInput - The input type for the aiProjectOverview function.
 * - AiProjectOverviewOutput - The return type for the aiProjectOverview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const maxDuration = 60;

/**
 * Represents the input for the AI project overview flow.
 * It expects the concatenated content of the codebase files.
 */
const AiProjectOverviewInputSchema = z.object({
  codebaseContent: z
    .string()
    .describe(
      'The full content of the codebase files, concatenated and potentially with file path separators or other context markers.'
    ),
});
export type AiProjectOverviewInput = z.infer<typeof AiProjectOverviewInputSchema>;

/**
 * Represents the output from the AI project overview flow.
 * It includes a summary, tech stack, and architecture description.
 */
const AiProjectOverviewOutputSchema = z.object({
  summary: z.string().describe("A high-level summary of the project's purpose."),
  techStack: z
    .array(z.string())
    .describe('An array of technologies, frameworks, and languages used in the project.'),
  architecture: z.string().describe("An explanation of the project's overall architecture."),
});
export type AiProjectOverviewOutput = z.infer<typeof AiProjectOverviewOutputSchema>;

/**
 * Generates a high-level overview of a software project based on its codebase content.
 *
 * @param input - An object containing the `codebaseContent` string.
 * @returns A promise that resolves to an object containing the project `summary`, `techStack`, and `architecture`.
 */
export async function aiProjectOverview(
  input: AiProjectOverviewInput
): Promise<AiProjectOverviewOutput> {
  return aiProjectOverviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProjectOverviewPrompt',
  input: {schema: AiProjectOverviewInputSchema},
  output: {schema: AiProjectOverviewOutputSchema},
  prompt: `You are an expert software architect and analyst. Your task is to analyze the provided codebase content and extract a high-level summary of its purpose, the technologies used, and its overall architectural structure.

Please consider the entire provided codebase content to formulate your analysis.

Codebase Content:
---
{{{codebaseContent}}}
---

Based on the above codebase content, provide your analysis in a structured JSON format with the following fields:
1.  "summary": A concise, high-level summary (1-3 sentences) of the project's main purpose and functionality.
2.  "techStack": An array of strings listing the primary technologies, frameworks, and programming languages identified (e.g., "React", "Node.js", "Express", "MongoDB", "TypeScript", "Python", "FastAPI").
3.  "architecture": A descriptive explanation of the project's overall architecture, including key components (e.g., frontend, backend, database), how they interact, and any notable design patterns or data flows.

Ensure the output is valid JSON and directly adheres to the schema provided.`,
});

const aiProjectOverviewFlow = ai.defineFlow(
  {
    name: 'aiProjectOverviewFlow',
    inputSchema: AiProjectOverviewInputSchema,
    outputSchema: AiProjectOverviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No output received from the AI model.');
    }
    return output;
  }
);
