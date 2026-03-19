import OpenAI from "openai";

/**
 * AI API Route - Pro Architecture
 * Handles codebase analysis using a multi-step pipeline:
 * 1. Chunking: Splitting large input to fit context windows.
 * 2. Step-wise Analysis: Individual processing of each code segment.
 * 3. Synthesis: Merging individual insights into a cohesive architectural overview.
 */

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "gsk-xxxx",
  baseURL: "https://api.groq.com/openai/v1",
});

const CHUNK_SIZE = 4000;
const MODEL = "llama-3.1-8b-instant";

/**
 * Utility to split large text into manageable chunks.
 */
function chunkText(text: string, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

/**
 * Step 1: Analyze an individual chunk of code.
 */
async function analyzeChunk(chunk: string, systemPrompt?: string) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt || "You are a senior code analyst. Extract key structure, components, and logic from this code segment. Be concise.",
      },
      {
        role: "user",
        content: chunk,
      },
    ],
    max_tokens: 800,
  });

  return completion.choices[0].message.content || "";
}

/**
 * Step 2: Merge multiple analyses into a final polished output.
 */
async function mergeAnalysis(results: string[], originalPrompt: string, jsonMode: boolean) {
  const combined = results.join("\n\n---\n\n");

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a professional software architect. Combine and refine the following segmented analyses into a single, high-quality structured explanation. ${
          jsonMode ? "Your response MUST be a valid JSON object matching the requested format." : ""
        }`,
      },
      {
        role: "user",
        content: `Original Task: ${originalPrompt}\n\nSegmented Analysis Results:\n${combined}`,
      },
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    max_tokens: 1200,
  });

  return completion.choices[0].message.content || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, systemPrompt, jsonMode = false } = body;
    const content = (input || body.prompt || "").toString();

    if (!content) {
      return Response.json({ result: "" });
    }

    // Split input if it exceeds chunk size
    const chunks = chunkText(content);
    
    // Process chunks (sequential to respect rate limits)
    const analyses = [];
    for (const chunk of chunks) {
      const result = await analyzeChunk(chunk, systemPrompt);
      analyses.push(result);
    }

    // Synthesize final result
    const finalResult = await mergeAnalysis(analyses, content.slice(0, 500), jsonMode);

    return Response.json({
      result: finalResult,
    });
  } catch (e: any) {
    console.error("PRO AI API ERROR:", e);
    return Response.json(
      { error: "AI Pipeline Failed", message: e.message },
      { status: 500 }
    );
  }
}
