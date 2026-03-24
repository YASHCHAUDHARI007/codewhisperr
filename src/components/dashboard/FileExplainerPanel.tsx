"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Sparkles, Loader2, BrainCircuit, Terminal } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
            systemPrompt: "You are a world-class software engineer. Explain this file's role, its core functions, and any complex logic. Use clean formatting with bold headers. Be technical yet clear.",
            input: `Path: ${file.filePath}\nContent:\n${file.fileContent.slice(0, 10000)}`,
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
        setExplanation("Analysis failed. The AI engine is experiencing high traffic.");
      } finally {
        setLoading(false);
        setIsStreaming(false);
      }
    }

    explainFile();
  }, [file]);

  return (
    <div className="h-full flex gap-0">
      {/* Code Editor View */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <div className="h-10 px-4 flex items-center justify-between glass border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-code text-muted-foreground uppercase tracking-widest font-bold">
            <Terminal className="w-3 h-3" />
            {file.filePath}
          </div>
          <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-red-500/50" />
             <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
             <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-[#020617]/50">
          <ScrollArea className="h-full">
            <div className="p-6 font-code text-sm leading-relaxed text-muted-foreground/80">
               {file.fileContent.split('\n').map((line: string, i: number) => (
                 <div key={i} className="flex gap-6 group hover:bg-white/5 transition-colors">
                   <span className="w-8 text-right text-white/10 select-none group-hover:text-white/30">{i + 1}</span>
                   <pre className="whitespace-pre">{line || ' '}</pre>
                 </div>
               ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* AI Analysis Panel */}
      <div className="w-[450px] flex flex-col min-w-0 bg-[#020617]/30">
        <div className="h-10 px-4 flex items-center glass border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-headline text-primary uppercase tracking-[0.2em] font-bold">
            <Sparkles className="w-3 h-3" />
            Intelligence Output
          </div>
        </div>
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full">
            <div className="p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <BrainCircuit className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-headline font-bold text-white text-lg tracking-tight">Synthesizing Logic</h4>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Running parallel modules</p>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "prose prose-invert prose-sm max-w-none text-muted-foreground/90 leading-relaxed whitespace-pre-wrap font-body",
                  isStreaming && "typing-cursor"
                )}>
                  {explanation || "Initializing neural network..."}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
