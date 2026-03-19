"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Boxes, Layers, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ProjectOverviewPanel({ codebaseContent }: { codebaseContent: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedContent = useRef<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      // Don't re-run if content hasn't changed or is empty
      if (!codebaseContent || codebaseContent === lastProcessedContent.current) {
        return;
      }
      
      lastProcessedContent.current = codebaseContent;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemPrompt: "Analyze the project structure and return a JSON object with: summary (string), techStack (array of strings), and architecture (string).",
            prompt: codebaseContent,
            jsonMode: true
          }),
        });

        if (!res.ok) throw new Error("AI synthesis failed");
        
        const responseData = await res.json();
        const result = responseData.result;
        
        try {
          const parsed = typeof result === 'string' ? JSON.parse(result) : result;
          setData(parsed);
        } catch (parseErr) {
          console.error("JSON parse error:", result);
          throw new Error("Invalid AI response format");
        }
      } catch (error: any) {
        console.error("Failed to load overview", error);
        setError(error.message || "Something went wrong during analysis");
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [codebaseContent]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 py-12">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <Zap className="w-5 h-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-headline font-bold">Architectural Synthesis</h3>
          <p className="text-sm text-muted-foreground">Mapping dependencies and identifying core frameworks...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl opacity-40">
           <Skeleton className="h-40 w-full bg-white/5" />
           <Skeleton className="h-40 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div className="space-y-1">
          <h3 className="text-lg font-headline font-bold">Analysis Failed</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!data && !codebaseContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
        <Layers className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">Waiting for codebase content to analyze...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 animate-in fade-in duration-700">
        <Card className="col-span-1 md:col-span-2 bg-card/50 border-white/5 overflow-hidden group">
          <div className="h-1 bg-primary w-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-headline">
              <Zap className="w-5 h-5 text-primary" />
              Project Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {data?.summary || "Analyzing codebase summary..."}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 group">
          <div className="h-1 bg-accent w-full opacity-50 group-hover:opacity-100 transition-opacity" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-headline">
              <Boxes className="w-5 h-5 text-accent" />
              Tech Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data?.techStack?.length > 0 ? (
                data.techStack.map((tech: string, i: number) => (
                  <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {tech}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Detecting languages and libraries...</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 group">
          <div className="h-1 bg-white/10 w-full group-hover:bg-primary transition-colors" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-headline">
              <Layers className="w-5 h-5 text-primary" />
              Architecture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {data?.architecture || "Deducing architectural patterns..."}
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
