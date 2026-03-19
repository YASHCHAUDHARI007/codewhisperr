"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Code, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FileExplainerPanel({ file }: { file: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function explainFile() {
      setLoading(true);
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemPrompt: "You are an AI assistant helping developers understand code. Return a JSON object with a single field 'explanation'.",
            prompt: `Explain this file's role and functionality in the project.\nPath: ${file.filePath}\nContent:\n${file.fileContent}`,
            jsonMode: true
          }),
        });

        if (!res.ok) throw new Error("API request failed");
        
        const responseData = await res.json();
        const parsed = JSON.parse(responseData.result);
        setData(parsed);
      } catch (error) {
        console.error("Failed to explain file", error);
      } finally {
        setLoading(false);
      }
    }
    if (file) {
      explainFile();
    }
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
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-4 w-5/6 bg-muted" />
                <Skeleton className="h-4 w-4/6 bg-muted" />
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap pb-6">
                {data?.explanation}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
