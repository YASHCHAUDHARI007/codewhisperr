import OpenAI from "openai";

/**
 * PRO AI API - Streaming & Parallel Performance Edition
 */

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk-xxxx",
  baseURL: "https://api.groq.com/openai/v1",
});

const CHUNK_SIZE = 4000;
const MODEL = "llama-3.1-8b-instant";

function chunkText(text: string, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function analyzeChunk(chunk: string) {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a senior code analyst. Extract key structure and logic from this specific chunk. Be extremely concise and objective.",
        },
        {
          role: "user",
          content: chunk,
        },
      ],
      max_tokens: 400,
    });
    return completion.choices[0].message.content || "";
  } catch (e) {
    console.error("Chunk analysis failed", e);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, systemPrompt, jsonMode = false, stream = false } = body;
    const content = (input || body.prompt || "").toString();

    if (!content) return Response.json({ result: jsonMode ? JSON.stringify({ summary: "No code provided", techStack: [], architecture: "N/A" }) : "No content provided." });

    // 1. Parallelize initial chunk processing for speed
    const chunks = chunkText(content.slice(0, 16000)); // Limit total context for speed
    const analyses = await Promise.all(chunks.map(chunk => analyzeChunk(chunk)));
    const combinedAnalysis = analyses.filter(Boolean).join("\n\n---\n\n");

    // 2. Final Synthesis (Streaming vs Non-Streaming)
    if (stream) {
      const responseStream = await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a professional software architect. Refine the following analyses into a clear, direct explanation. ${systemPrompt || ""}`,
          },
          {
            role: "user",
            content: `Segmented Analysis:\n${combinedAnalysis}`,
          },
        ],
        stream: true,
        max_tokens: 1000,
      });

      const encoder = new TextEncoder();
      return new Response(
        new ReadableStream({
          async start(controller) {
            for await (const chunk of responseStream) {
              const text = chunk.choices[0]?.delta?.content || "";
              controller.enqueue(encoder.encode(text));
            }
            controller.close();
          },
        })
      );
    } else {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `${systemPrompt || "You are a professional software architect."} ${
              jsonMode ? "CRITICAL: Return ONLY a valid JSON object. No backticks. No explanation text." : ""
            }`,
          },
          {
            role: "user",
            content: `Intermediate Analysis Results:\n${combinedAnalysis}`,
          },
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined,
        max_tokens: 1000,
      });

      return Response.json({ result: completion.choices[0].message.content || "" });
    }
  } catch (e: any) {
    console.error("API Error:", e);
    return Response.json({ error: "AI Failed", message: e.message }, { status: 500 });
  }
}
