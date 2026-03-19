"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FileExplainerPanel({ file }: { file: any }) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const currentFileId = useRef<string | null>(null);

  useEffect(() => {
    async function explainFile() {
      if (!file || currentFileId.current === file.id) return;
      
      currentFileId.current = file.id;
      setExplanation("");
      setLoading(true);
      setIsStreaming(false);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemPrompt: "Explain this file's role and logic clearly. Use bullet points for key functions. Be direct.",
            input: `Path: ${file.filePath}\nContent:\n${file.fileContent.slice(0, 6000)}`,
            stream: true
          }),
        });

        if (!res.ok) throw new Error("API request failed");
        
        setLoading(false);
        setIsStreaming(true);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) throw new Error("No reader available");

        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setExplanation(fullText);
        }
      } catch (error) {
        console.error("Failed to explain file", error);
        setExplanation("Failed to load explanation. The AI service might be temporarily unavailable.");
      } finally {
        setLoading(false);
        setIsStreaming(false);
      }
    }

    explainFile();
  }, [file]);

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
      <Card className="bg-card/30 border-white/5 flex flex-col min-h-0">
        <CardHeader className="shrink-0 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-code flex items-center gap-2 text-primary">
            <Code className="w-4 h-4" />
            {file.filePath}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <pre className="p-6 text-xs font-code text-muted-foreground leading-relaxed">
              <code>{file.fileContent}</code>
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-white/5 flex flex-col min-h-0 overflow-hidden group">
        <div className="h-1 bg-accent w-full opacity-50 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="shrink-0">
          <CardTitle className="flex items-center gap-2 text-xl font-headline">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Explanation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-accent animate-spin" />
                  <BrainCircuit className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h4 className="font-headline font-bold text-white">Synthesizing Logic</h4>
                  <p className="text-xs text-muted-foreground">Breaking down functions and dependencies...</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap pb-6 px-4">
                {explanation || "Initializing analysis..."}
                {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-accent animate-pulse align-middle" />}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
