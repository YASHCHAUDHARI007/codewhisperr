
"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Boxes, Layers, CheckCircle2, Loader2, AlertCircle, Bug, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiProjectOverview, type AiProjectOverviewOutput } from '@/ai/flows/ai-project-overview';
import { FlowchartPanel } from './FlowchartPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        setError("Failed to synthesize codebase architecture. Please try again.");
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
          <h3 className="text-xl font-headline font-bold">Deep Architectural Mapping</h3>
          <p className="text-sm text-muted-foreground">Running parallel tasks: Summary, Tech Stack, & Logic Flow...</p>
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
        <h3 className="text-lg font-headline font-bold">Analysis Failed</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="h-full flex flex-col">
      <div className="px-1 mb-4">
        <TabsList className="bg-card/30 border border-white/5">
          <TabsTrigger value="overview">Insight Dashboard</TabsTrigger>
          <TabsTrigger value="flowchart">Logic Visualization</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 animate-in fade-in duration-700">
            <Card className="md:col-span-2 bg-card/50 border-white/5 overflow-hidden group">
              <div className="h-1 bg-primary w-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-headline">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Codebase Synthesis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{data?.summary}</p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Architecture</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data?.architecture}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-card/50 border-white/5 group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-headline">
                    <Boxes className="w-5 h-5 text-accent" />
                    Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data?.techStack?.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/5 group border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-headline text-destructive">
                    <Bug className="w-5 h-5" />
                    Bugs & Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data?.bugs?.map((bug, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-destructive font-bold">•</span>
                        {bug}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="flowchart" className="flex-1 min-h-0 mt-0">
        <FlowchartPanel chartDefinition={data?.mermaidFlowchart} />
      </TabsContent>
    </Tabs>
  );
}
