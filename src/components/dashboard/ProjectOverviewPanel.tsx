"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Boxes, Layers, CheckCircle2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ProjectOverviewPanel({ codebaseContent }: { codebaseContent: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      if (!codebaseContent) return;
      setLoading(true);
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemPrompt: "Analyze the code and return JSON with: summary (string), techStack (array), architecture (string). Be extremely concise.",
            prompt: `Codebase Extract:\n${codebaseContent}`,
            jsonMode: true
          }),
        });

        if (!res.ok) throw new Error("API request failed");
        
        const responseData = await res.json();
        const parsed = JSON.parse(responseData.result);
        setData(parsed);
      } catch (error) {
        console.error("Failed to load overview", error);
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
          <h3 className="text-xl font-headline font-bold">Generating Overview</h3>
          <p className="text-sm text-muted-foreground">Mapping modules and detecting tech stack...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl opacity-40">
           <Skeleton className="h-40 w-full bg-white/5" />
           <Skeleton className="h-40 w-full bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
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
              {data?.summary}
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
              {data?.techStack?.map((tech: string, i: number) => (
                <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {tech}
                </Badge>
              ))}
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
              {data?.architecture}
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
