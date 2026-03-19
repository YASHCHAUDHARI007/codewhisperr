'use server';
/**
 * @fileOverview This file implements a Genkit flow for explaining individual files.
 */

import { ai, AI_MODEL } from '@/ai/genkit';
import { z } from 'genkit';

const AiFileModuleExplanationInputSchema = z.object({
  filePath: z.string().describe('The full path of the file.'),
  fileContent: z.string().describe('The complete content of the file.'),
});
export type AiFileModuleExplanationInput = z.infer<typeof AiFileModuleExplanationInputSchema>;

const AiFileModuleExplanationOutputSchema = z.object({
  explanation: z.string().describe("A clear and simple explanation of the file's role."),
});
export type AiFileModuleExplanationOutput = z.infer<typeof AiFileModuleExplanationOutputSchema>;

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

export async function aiFileModuleExplanation(input: AiFileModuleExplanationInput): Promise<AiFileModuleExplanationOutput> {
  return callWithRetry(() => aiFileModuleExplanationFlow(input));
}

const aiFileModuleExplanationFlow = ai.defineFlow(
  {
    name: 'aiFileModuleExplanationFlow',
    inputSchema: AiFileModuleExplanationInputSchema,
    outputSchema: AiFileModuleExplanationOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: AI_MODEL,
      input: {
        text: `Explain this file's role and functionality.
        Path: ${input.filePath}
        Content:
        ${input.fileContent}`,
      },
      output: { schema: AiFileModuleExplanationOutputSchema },
    });

    if (!output) throw new Error('AI failed to generate file explanation.');
    return output;
  }
);
