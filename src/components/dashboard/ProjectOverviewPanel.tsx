"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Boxes, Layers, AlertCircle, Bug, Sparkles, Activity, ShieldAlert, Cpu, ListCheck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiProjectOverview, type AiProjectOverviewOutput } from '@/ai/flows/ai-project-overview';
import { FlowchartPanel } from './FlowchartPanel';
import { cn } from '@/lib/utils';

export function ProjectOverviewPanel({ codebaseContent }: { codebaseContent: string }) {
  const [data, setData] = useState<AiProjectOverviewOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastProcessedContent = useRef<string | null>(null);

  useEffect(() => {
    async function loadOverview() {
      if (!codebaseContent || codebaseContent === lastProcessedContent.current) return;
      
      lastProcessedContent.current = codebaseContent;
      setLoading(true);
      setError(null);

      try {
        const result = await aiProjectOverview({ codebaseContent });
        setData(result);
      } catch (error: any) {
        console.error("Analysis failed", error);
        setError("AI Synthesis failed. Please refine your codebase or try again.");
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [codebaseContent]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 bg-[#020617]/20">
        <div className="relative">
          <Activity className="w-16 h-16 text-primary animate-pulse" />
          <Cpu className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-headline font-bold text-white">Full Stack Mapping</h3>
          <p className="text-sm text-muted-foreground uppercase tracking-[0.3em] font-bold">Parallelizing: Logic • Security • Architecture</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-6 opacity-30">
           <Skeleton className="h-48 w-full rounded-2xl" />
           <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
        <AlertCircle className="w-16 h-16 text-destructive/50" />
        <h3 className="text-xl font-headline font-bold text-white">Synthesis Aborted</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Summary Section */}
              <Card className="md:col-span-8 bg-card/40 border-white/5 rounded-2xl overflow-hidden group">
                <div className="h-1 bg-primary w-full" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl font-headline text-white">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Architectural Synthesis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">Purpose</p>
                    <p className="text-lg text-muted-foreground/90 leading-relaxed font-body italic">
                      {data?.summary}
                    </p>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                       <Layers className="w-4 h-4" />
                       Functionality & Logic Flow
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {data?.architecture}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Info Section */}
              <div className="md:col-span-4 space-y-6">
                <Card className="bg-card/40 border-white/5 rounded-2xl group">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-headline text-white">
                      <Boxes className="w-5 h-5 text-primary" />
                      Tech Stack
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Core Technologies</p>
                      <ul className="grid grid-cols-1 gap-2">
                        {data?.techStack?.map((tech, i) => (
                          <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white/80 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {tech}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 border-destructive/20 rounded-2xl group bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-headline text-destructive">
                      <ShieldAlert className="w-5 h-5" />
                      Risks & Bugs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {data?.bugs?.map((bug, i) => (
                        <li key={i} className="text-xs text-muted-foreground/80 flex gap-3 group/item">
                          <span className="text-destructive font-black mt-0.5 transition-transform group-hover/item:scale-125">•</span>
                          {bug}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Visual Flowchart Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-px flex-1 bg-white/5" />
                 <h3 className="text-xs font-bold uppercase tracking-[0.5em] text-muted-foreground">Logic Visualization</h3>
                 <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="h-[500px]">
                <FlowchartPanel chartDefinition={data?.mermaidFlowchart} />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
