
'use server';
/**
 * @fileOverview This file implements interactive AI chat using the OpenAI SDK.
 */

import { openai, AI_MODEL } from '@/ai/genkit';
import { z } from 'zod';

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

export async function interactiveAiChat(input: { query: string, codebaseContent: string }): Promise<InteractiveAiChatOutput> {
  return callWithRetry(async () => {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an AI assistant helping a developer understand their codebase. Return a JSON object with a single field 'answer'."
        },
        {
          role: "user",
          content: `Context:\n${input.codebaseContent}\n\nUser Question:\n${input.query}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("AI failed to respond to query.");
    
    return JSON.parse(content) as InteractiveAiChatOutput;
  });
}
