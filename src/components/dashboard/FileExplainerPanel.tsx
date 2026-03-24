
"use client";

import { useEffect, useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import Typewriter from "typewriter-effect";
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, BrainCircuit, Terminal, Braces, Bug, FileText, ChevronDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function FileExplainerPanel({ file }: { file: any }) {
  const [explanation, setExplanation] = useState("");
  const [bugs, setBugs] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("explain");
  const currentFileId = useRef<string | null>(null);

  useEffect(() => {
    async function explainFile() {
      if (!file || currentFileId.current === file.id) return;
      
      currentFileId.current = file.id;
      setExplanation("");
      setBugs("");
      setSummary("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            systemPrompt: "You are a world-class software engineer. Break down your response into three sections labeled 'EXPLANATION:', 'BUGS:', and 'SUMMARY:'. Be technical, clear, and direct.",
            input: `Path: ${file.filePath}\nContent:\n${file.fileContent.slice(0, 15000)}`,
            stream: false
          }),
        });

        if (!res.ok) throw new Error("AI engine failure");
        
        const data = await res.json();
        const text = data.result || "";
        
        // Simple parsing for tabs
        const parts = text.split(/(EXPLANATION:|BUGS:|SUMMARY:)/i);
        let currentExp = "", currentBugs = "", currentSum = "";
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
          if (part.toUpperCase() === "EXPLANATION:") currentExp = parts[i+1] || "";
          if (part.toUpperCase() === "BUGS:") currentBugs = parts[i+1] || "";
          if (part.toUpperCase() === "SUMMARY:") currentSum = parts[i+1] || "";
        }

        setExplanation(currentExp || text);
        setBugs(currentBugs || "No specific issues identified in this module.");
        setSummary(currentSum || "Module analyzed successfully.");
      } catch (error) {
        console.error("AI Error:", error);
        setExplanation("Intelligence synthesis aborted. Neural network timed out.");
      } finally {
        setLoading(false);
      }
    }

    explainFile();
  }, [file]);

  return (
    <div className="h-full flex flex-col bg-[#0f172a]">
      {/* Top Half: Monaco Editor */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-10 px-4 flex items-center justify-between bg-[#020617] border-b border-[#1e293b] shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                <Braces className="w-3 h-3 text-primary" />
                {file.fileName}
             </div>
             <span className="text-[10px] text-muted-foreground/30 font-code">{file.filePath}</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
             <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
             <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
             <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-[#020617]/40">
           <Editor
              height="100%"
              defaultLanguage={file.fileExtension === 'tsx' ? 'typescript' : file.fileExtension || 'javascript'}
              theme="vs-dark"
              value={file.fileContent}
              options={{
                readOnly: true,
                minimap: { enabled: true },
                fontSize: 13,
                fontFamily: 'Source Code Pro',
                padding: { top: 20 },
                lineNumbersMinChars: 3,
                glyphMargin: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                backgroundColor: '#02061700'
              }}
            />
        </div>
      </div>

      {/* Bottom Half: AI Output Tabs */}
      <div className="h-[40%] flex flex-col border-t border-[#1e293b] bg-[#020617]/50">
        <div className="h-11 px-4 flex items-center justify-between border-b border-[#1e293b] bg-[#020617]/80 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex items-center">
            <TabsList className="bg-transparent border-0 h-full p-0 gap-8">
              <TabsTrigger value="explain" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest font-black text-muted-foreground data-[state=active]:text-white transition-all gap-2">
                 <FileText className="w-3 h-3" />
                 Explain
              </TabsTrigger>
              <TabsTrigger value="bugs" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest font-black text-muted-foreground data-[state=active]:text-white transition-all gap-2">
                 <Bug className="w-3 h-3" />
                 Bugs
              </TabsTrigger>
              <TabsTrigger value="summary" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest font-black text-muted-foreground data-[state=active]:text-white transition-all gap-2">
                 <Sparkles className="w-3 h-3" />
                 Summary
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
             <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-40">Intelligence Engine v2.0</div>
             <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
          </div>
        </div>

        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-5xl mx-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-pulse">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Decoding logic blocks...</p>
                </div>
              ) : (
                <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 shadow-2xl min-h-[150px]">
                  <Tabs value={activeTab} className="m-0">
                    <TabsContent value="explain" className="m-0 focus-visible:ring-0">
                       <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed font-body">
                          {explanation && (
                             <Typewriter
                                options={{
                                  strings: [explanation],
                                  autoStart: true,
                                  delay: 5,
                                  cursor: '',
                                }}
                             />
                          )}
                       </div>
                    </TabsContent>
                    <TabsContent value="bugs" className="m-0 focus-visible:ring-0">
                       <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed font-body">
                          {bugs && (
                             <Typewriter
                                options={{
                                  strings: [bugs],
                                  autoStart: true,
                                  delay: 5,
                                  cursor: '',
                                }}
                             />
                          )}
                       </div>
                    </TabsContent>
                    <TabsContent value="summary" className="m-0 focus-visible:ring-0">
                       <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed font-body">
                          {summary && (
                             <Typewriter
                                options={{
                                  strings: [summary],
                                  autoStart: true,
                                  delay: 5,
                                  cursor: '',
                                }}
                             />
                          )}
                       </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
