'use server';
/**
 * @fileOverview This file implements a Genkit flow for explaining individual files or modules within a codebase.
 *
 * - aiFileModuleExplanation - A function that handles the explanation of a given file/module.
 * - AiFileModuleExplanationInput - The input type for the aiFileModuleExplanation function.
 * - AiFileModuleExplanationOutput - The return type for the aiFileModuleExplanation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiFileModuleExplanationInputSchema = z.object({
  filePath: z.string().describe('The full path of the file to be explained within the codebase.'),
  fileContent: z.string().describe('The complete content of the file to be explained.'),
});
export type AiFileModuleExplanationInput = z.infer<typeof AiFileModuleExplanationInputSchema>;

const AiFileModuleExplanationOutputSchema = z.object({
  explanation: z.string().describe("A clear and simple explanation of the file's role, functionality, and how it integrates with other parts of the codebase."),
});
export type AiFileModuleExplanationOutput = z.infer<typeof AiFileModuleExplanationOutputSchema>;

export async function aiFileModuleExplanation(input: AiFileModuleExplanationInput): Promise<AiFileModuleExplanationOutput> {
  return aiFileModuleExplanationFlow(input);
}

const aiFileModuleExplanationPrompt = ai.definePrompt({
  name: 'aiFileModuleExplanationPrompt',
  input: { schema: AiFileModuleExplanationInputSchema },
  output: { schema: AiFileModuleExplanationOutputSchema },
  prompt: `You are an expert software architect and senior developer tasked with explaining a specific file from a codebase. Your goal is to provide a clear, simple, and concise explanation of the file's role, its core functionality, and how it integrates with other parts of the project.

Focus on the following aspects:
1.  **Role:** What is the overall purpose of this file within the larger project structure?
2.  **Functionality:** What specific tasks or operations does this file perform?
3.  **Integration:** How does this file interact with other files, modules, or external services in the codebase?

The file path is: {{{filePath}}}

The file content is provided below:
\`\`\`
{{{fileContent}}}
\`\`\`
Provide your explanation in plain text.`,
});

const aiFileModuleExplanationFlow = ai.defineFlow(
  {
    name: 'aiFileModuleExplanationFlow',
    inputSchema: AiFileModuleExplanationInputSchema,
    outputSchema: AiFileModuleExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await aiFileModuleExplanationPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate an explanation.');
    }
    return output;
  }
);
