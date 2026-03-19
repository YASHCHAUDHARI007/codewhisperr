
import { openai, AI_MODEL } from '@/ai/genkit';

/**
 * Dedicated API route for AI requests. 
 * This provides a stable execution context outside of Server Actions if needed.
 */
export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt, jsonMode = false } = await req.json();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No response from AI model.");

    return Response.json({ result: content });
  } catch (error: any) {
    console.error("AI API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
