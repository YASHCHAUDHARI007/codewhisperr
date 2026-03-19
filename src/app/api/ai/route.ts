import OpenAI from "openai";

/**
 * AI API Route
 * Handles all codebase analysis and chat requests using the OpenAI SDK configured for Groq.
 * Includes input trimming to stay within context limits and robust error handling.
 */
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk-xxxx",
  baseURL: "https://api.groq.com/openai/v1",
});

const MAX_CHARS = 8000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, systemPrompt, jsonMode = false } = body;

    // Support the primary 'input' key and fallback to 'prompt'
    const contentToProcess = (input || body.prompt || "").toString();
    
    // Trim the input to prevent exceeding context limits (Important for large codebase analysis)
    const trimmedInput = contentToProcess.slice(0, MAX_CHARS);

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: trimmedInput }
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    
    // Return structured result
    return Response.json({
      result: content,
    });
  } catch (e: any) {
    console.error("AI API ERROR:", e);
    // Standardized error response for the frontend to handle gracefully
    return Response.json({ error: "AI failed", message: e.message }, { status: 500 });
  }
}
