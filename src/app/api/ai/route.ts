import OpenAI from "openai";

/**
 * Central AI API Route
 * Handles all codebase analysis and chat requests using the OpenAI SDK configured for Groq.
 * Includes input trimming and robust error handling for stability.
 */
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk-xxxx",
  baseURL: "https://api.groq.com/openai/v1",
});

const MAX_CHARS = 8000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, input, systemPrompt, jsonMode = false } = body;

    // Support both 'prompt' and 'input' keys for flexibility across different components
    const contentToProcess = (prompt || input || "").toString();
    
    // Trim the input to prevent exceeding context limits or causing slow responses
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
    
    return Response.json({
      result: content,
    });
  } catch (e: any) {
    console.error("AI API ERROR:", e);
    // Explicit error response as requested
    return Response.json({ error: "AI failed", message: e.message }, { status: 500 });
  }
}
