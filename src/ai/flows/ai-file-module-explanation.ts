
'use server';
/**
 * @fileOverview This file implements AI generation for file explanations using the OpenAI SDK.
 */

import { openai, AI_MODEL } from '@/ai/genkit';
import { z } from 'zod';

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

export async function aiFileModuleExplanation(input: { filePath: string, fileContent: string }): Promise<AiFileModuleExplanationOutput> {
  return callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping developers understand code. Return a JSON object with a single field 'explanation'."
        },
        {
          role: "user",
          content: `Explain this file's role and functionality in the project.\nPath: ${input.filePath}\nContent:\n${input.fileContent}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("AI failed to generate file explanation.");
    
    return JSON.parse(content) as AiFileModuleExplanationOutput;
  });
}
