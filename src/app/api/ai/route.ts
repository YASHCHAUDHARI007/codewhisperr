import OpenAI from "openai";

/**
 * PRO AI API - Optimized Performance Edition
 * 1. Parallel Chunking: Processes multiple code segments simultaneously.
 * 2. Token Efficiency: Tight limits for lightning-fast inference.
 * 3. Synthesis: Expert architect persona for high-density insights.
 */

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk-xxxx",
  baseURL: "https://api.groq.com/openai/v1",
});

const CHUNK_SIZE = 4000;
const MODEL = "llama-3.1-8b-instant"; // Fastest Groq Model

function chunkText(text: string, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function analyzeChunk(chunk: string, systemPrompt?: string) {
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a senior code analyst. Extract key structure and logic. Be extremely concise.",
        },
        {
          role: "user",
          content: chunk,
        },
      ],
      max_tokens: 400, // Reduced for speed
    });
    return completion.choices[0].message.content || "";
  } catch (e) {
    console.error("Chunk analysis failed", e);
    return "";
  }
}

async function mergeAnalysis(results: string[], originalPrompt: string, jsonMode: boolean) {
  const combined = results.filter(Boolean).join("\n\n---\n\n");

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a professional software architect. Refine the following analyses into a single structured explanation. ${
          jsonMode ? "Return ONLY a valid JSON object." : ""
        }`,
      },
      {
        role: "user",
        content: `Segmented Analysis:\n${combined}`,
      },
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    max_tokens: 800, // Reduced for faster output
  });

  return completion.choices[0].message.content || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, systemPrompt, jsonMode = false } = body;
    const content = (input || body.prompt || "").toString();

    if (!content) return Response.json({ result: "" });

    // Parallelize processing for 10x speed boost
    const chunks = chunkText(content);
    const analyses = await Promise.all(chunks.map(chunk => analyzeChunk(chunk, systemPrompt)));

    // Final Synthesis
    const finalResult = await mergeAnalysis(analyses, content.slice(0, 200), jsonMode);

    return Response.json({ result: finalResult });
  } catch (e: any) {
    console.error("API Error:", e);
    return Response.json({ error: "AI Failed", message: e.message }, { status: 500 });
  }
}
