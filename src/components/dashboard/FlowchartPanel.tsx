
"use client";

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

export function FlowchartPanel({ chartDefinition }: { chartDefinition?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartDefinition && containerRef.current) {
      containerRef.current.innerHTML = `<div class="mermaid">${chartDefinition}</div>`;
      mermaid.contentLoaded();
    }
  }, [chartDefinition]);

  if (!chartDefinition) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
        <Layers className="w-16 h-16 text-muted-foreground" />
        <p className="text-sm">Run project analysis to generate logic flowcharts.</p>
      </div>
    );
  }

  return (
    <Card className="h-full bg-card/50 border-white/5 flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-background/20">
        <CardTitle className="flex items-center gap-2 text-lg font-headline">
          <Layers className="w-5 h-5 text-primary" />
          Logic Flow Visualization
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-8 flex items-center justify-center">
        <div ref={containerRef} className="w-full max-w-4xl" />
      </CardContent>
    </Card>
  );
}
