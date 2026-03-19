'use server';
/**
 * @fileOverview An interactive AI chat agent that answers questions about a given codebase.
 *
 * - interactiveAiChat - A function that handles user queries about a codebase.
 * - InteractiveAiChatInput - The input type for the interactiveAiChat function.
 * - InteractiveAiChatOutput - The return type for the interactiveAiChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InteractiveAiChatInputSchema = z.object({
  query: z.string().describe("The user's natural language question about the codebase."),
  codebaseContent: z
    .string()
    .describe('The relevant parts of the codebase content to answer the query.'),
});
export type InteractiveAiChatInput = z.infer<typeof InteractiveAiChatInputSchema>;

const InteractiveAiChatOutputSchema = z.object({
  answer: z.string().describe("The AI's answer to the user's query."),
});
export type InteractiveAiChatOutput = z.infer<typeof InteractiveAiChatOutputSchema>;

export async function interactiveAiChat(input: InteractiveAiChatInput): Promise<InteractiveAiChatOutput> {
  return interactiveAiChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interactiveAiChatPrompt',
  input: { schema: InteractiveAiChatInputSchema },
  output: { schema: InteractiveAiChatOutputSchema },
  prompt: `You are an expert software engineer and codebase analyst. Your task is to answer questions about the provided codebase content. If the information is not present in the provided context, state that you cannot find the information within the given context.

Codebase Context:
\`\`\`
{{{codebaseContent}}}
\`\`\`

User's Question:
{{{query}}}

Based on the codebase context, provide a clear, concise, and helpful answer to the user's question. Output your answer in the specified JSON format.
`,
});

const interactiveAiChatFlow = ai.defineFlow(
  {
    name: 'interactiveAiChatFlow',
    inputSchema: InteractiveAiChatInputSchema,
    outputSchema: InteractiveAiChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
