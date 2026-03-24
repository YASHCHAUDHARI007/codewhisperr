"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Boxes, Layers, AlertCircle, Sparkles, Activity, ShieldAlert, Cpu, CheckCircle2, ListChecks, FileText, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiProjectOverview, type AiProjectOverviewOutput } from '@/ai/flows/ai-project-overview';
import { FlowchartPanel } from './FlowchartPanel';

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
        setError("AI synthesis failed. This can happen if the codebase is too large or contains complex binary files.");
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, [codebaseContent]);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] md:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
        <h3 className="text-xl font-semibold">Analysis Incomplete</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <ScrollArea className="h-full">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Confidence" value={`${data.confidenceScore}%`} icon={<Zap className="w-4 h-4" />} color="text-primary" />
          <MetricCard title="Languages" value={data.languages.length.toString()} icon={<Globe className="w-4 h-4" />} color="text-slate-500" />
          <MetricCard title="Suggestions" value={data.suggestionsCount.toString()} icon={<ListChecks className="w-4 h-4" />} color="text-amber-500" />
          <MetricCard title="Issues" value={data.bugs.length.toString()} icon={<ShieldAlert className="w-4 h-4" />} color="text-destructive" />
          <MetricCard title="Tech Stack" value={data.techStack.length.toString()} icon={<Boxes className="w-4 h-4" />} color="text-blue-500" />
          <MetricCard title="Modules" value="Synthesized" icon={<Activity className="w-4 h-4" />} color="text-green-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" /> Project Summary
              </CardTitle>
              <CardDescription>Synthesized overview of project purpose and architecture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Purpose</p>
                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{data.summary}</p>
              </div>
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">System Architecture</p>
                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{data.architecture}</div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Boxes className="w-5 h-5 text-primary" /> Tech Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.techStack.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 text-xs font-medium">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/10 bg-destructive/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <ShieldAlert className="w-5 h-5" /> Risks & Bugs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.bugs.map((bug, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                      <span className="text-destructive font-bold">•</span> {bug}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200/20 bg-amber-500/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-5 h-5" /> Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {data.optimizationTips.map((tip, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logic Visualization</h3>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="h-[500px] border rounded-xl bg-white dark:bg-slate-900">
            <FlowchartPanel chartDefinition={data.mermaidFlowchart} />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function MetricCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
          <div className={color}>{icon}</div>
        </div>
        <span className="text-xl font-bold">{value}</span>
      </CardContent>
    </Card>
  );
}