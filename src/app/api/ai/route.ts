import OpenAI from "openai";

/**
 * Central AI API Route
 * Handles all codebase analysis and chat requests using the OpenAI SDK configured for Groq.
 */
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk-xxxx", // Use env var or prototype fallback
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { prompt, systemPrompt, jsonMode = false } = await req.json();

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: prompt }
      ],
      response_format: jsonMode ? { type: "json_object" } : undefined,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    
    return Response.json({
      result: content,
    });
  } catch (e: any) {
    console.error("AI API ERROR:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal AI Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
