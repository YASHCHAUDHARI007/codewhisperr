"use client";

import { useEffect, useState } from 'react';
import { aiFileModuleExplanation, AiFileModuleExplanationOutput } from '@/ai/flows/ai-file-module-explanation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Code, FileText, Sparkles } from 'lucide-react';
import { FileNode } from '@/app/lib/mock-codebase';
import { ScrollArea } from '@/components/ui/scroll-area';

export function FileExplainerPanel({ file }: { file: FileNode }) {
  const [data, setData] = useState<AiFileModuleExplanationOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function explainFile() {
      setLoading(true);
      try {
        const result = await aiFileModuleExplanation({
          filePath: file.path,
          fileContent: file.content || ""
        });
        setData(result);
      } catch (error) {
        console.error("Failed to explain file", error);
      } finally {
        setLoading(false);
      }
    }
    if (file.type === 'file') {
      explainFile();
    }
  }, [file]);

  return (
    <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
      <Card className="bg-card/30 border-white/5 flex flex-col min-h-0">
        <CardHeader className="shrink-0 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-code flex items-center gap-2 text-primary">
            <Code className="w-4 h-4" />
            {file.path}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <pre className="p-6 text-xs font-code text-muted-foreground leading-relaxed">
              <code>{file.content}</code>
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