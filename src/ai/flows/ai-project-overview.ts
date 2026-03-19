
'use server';
/**
 * @fileOverview This file implements AI generation for project overviews using the direct OpenAI SDK.
 */

import { openai, AI_MODEL } from '@/ai/genkit';
import { z } from 'zod';

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

export async function aiProjectOverview(input: { codebaseContent: string }): Promise<AiProjectOverviewOutput> {
  return callWithRetry(async () => {
    // Direct SDK call avoids the 'Model undefined' Genkit registry bug
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert software architect. Analyze the codebase and return a JSON object with: summary (string), techStack (array of strings), and architecture (string)."
        },
        {
          role: "user",
          content: `Analyze the provided codebase and return a structured overview.\n\nCodebase:\n${input.codebaseContent}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("AI failed to generate project overview.");
    
    return JSON.parse(content) as AiProjectOverviewOutput;
  });
}
