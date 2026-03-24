"use client";

import { useEffect, useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, Braces, Bug, FileText, ChevronDown, CheckCircle2, Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export function FileExplainerPanel({ file }: { file: any }) {
  const [explanation, setExplanation] = useState("");
  const [bugs, setBugs] = useState("");
  const [optimization, setOptimization] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("explain");
  const currentFileId = useRef<string | null>(null);

  useEffect(() => {
    async function explainFile() {
      if (!file || currentFileId.current === file.id) return;
      currentFileId.current = file.id;
      setExplanation("");
      setBugs("");
      setOptimization("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemPrompt: "You are a senior software engineer. Analyze the code and provide structured insights in three sections labeled 'EXPLANATION:', 'BUGS:', and 'OPTIMIZATION:'. Be precise, technical, and objective.",
            input: `Path: ${file.filePath}\nContent:\n${file.fileContent.slice(0, 15000)}`,
          }),
        });

        if (!res.ok) throw new Error("AI engine failure");
        const data = await res.json();
        const text = data.result || "";
        
        const parts = text.split(/(EXPLANATION:|BUGS:|OPTIMIZATION:)/i);
        let currentExp = "", currentBugs = "", currentOpt = "";
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          if (part.toUpperCase() === "EXPLANATION:") currentExp = parts[i+1] || "";
          if (part.toUpperCase() === "BUGS:") currentBugs = parts[i+1] || "";
          if (part.toUpperCase() === "OPTIMIZATION:") currentOpt = parts[i+1] || "";
        }

        setExplanation(currentExp || text);
        setBugs(currentBugs || "No critical issues detected in this module.");
        setOptimization(currentOpt || "Code is following standard architectural patterns.");
      } catch (error) {
        console.error("AI Error:", error);
        setExplanation("Failed to synthesize module intelligence. The file may be too large for current context limits.");
      } finally {
        setLoading(false);
      }
    }
    explainFile();
  }, [file]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950">
      <div className="flex-1 min-h-0 flex flex-col border-b">
        <div className="h-10 px-4 flex items-center justify-between border-b bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="text-[10px] font-mono gap-1.5 h-6">
                <Braces className="w-3 h-3 text-primary" /> {file.fileName}
             </Badge>
             <span className="text-[10px] text-muted-foreground font-mono opacity-60 truncate max-w-md">{file.filePath}</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
             <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex-1 min-h-0">
           <Editor
              height="100%"
              defaultLanguage={file.fileExtension === 'tsx' ? 'typescript' : file.fileExtension || 'javascript'}
              theme="vs-dark"
              value={file.fileContent}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Source Code Pro, monospace',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                renderLineHighlight: 'all',
                backgroundColor: '#00000000'
              }}
            />
        </div>
      </div>

      <div className="h-[40%] flex flex-col bg-slate-50 dark:bg-slate-900/20">
        <div className="h-10 px-4 flex items-center justify-between border-b bg-white dark:bg-slate-950">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="bg-transparent h-full p-0 gap-6">
              <TabsTrigger value="explain" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-[11px] font-bold uppercase tracking-wider">
                 Explanation
              </TabsTrigger>
              <TabsTrigger value="bugs" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent text-[11px] font-bold uppercase tracking-wider">
                 Issues
              </TabsTrigger>
              <TabsTrigger value="opt" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent text-[11px] font-bold uppercase tracking-wider">
                 Optimization
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-5xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Synthesizing insights...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Tabs value={activeTab} className="m-0">
                  <TabsContent value="explain" className="m-0 focus-visible:ring-0">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed font-body whitespace-pre-wrap">
                      {explanation}
                    </div>
                  </TabsContent>
                  <TabsContent value="bugs" className="m-0 focus-visible:ring-0">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed font-body whitespace-pre-wrap">
                      {bugs}
                    </div>
                  </TabsContent>
                  <TabsContent value="opt" className="m-0 focus-visible:ring-0">
                    <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-600 dark:text-slate-400 leading-relaxed font-body whitespace-pre-wrap">
                      {optimization}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}