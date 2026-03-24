"use client";

import { useState, useMemo, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileTree } from '@/components/dashboard/FileTree';
import { ProjectOverviewPanel } from '@/components/dashboard/ProjectOverviewPanel';
import { FileExplainerPanel } from '@/components/dashboard/FileExplainerPanel';
import { AIChatPanel } from '@/components/dashboard/AIChatPanel';
import { Code2, LayoutDashboard, MessageSquare, Info, ChevronRight, Loader2, Home, Search, FileCode, Bug, RefreshCw, Sparkles, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';

const GUEST_USER_ID = 'anonymous_explorer';

export default function DashboardPage() {
  const { id: projectId } = useParams() as { id: string };
  const db = useFirestore();
  const router = useRouter();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingStep, setLoadingStep] = useState(0);

  const projectRef = useMemoFirebase(() => {
    if (!db || !projectId) return null;
    return doc(db, 'users', GUEST_USER_ID, 'projects', projectId);
  }, [db, projectId]);

  const filesRef = useMemoFirebase(() => {
    if (!db || !projectId) return null;
    return collection(db, 'users', GUEST_USER_ID, 'projects', projectId, 'codeFiles');
  }, [db, projectId]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);
  const { data: files, isLoading: isFilesLoading } = useCollection(filesRef);

  // Simulated analysis steps for the hero animation
  useEffect(() => {
    if (project?.status === 'processing') {
      const interval = setInterval(() => {
        setLoadingStep(s => (s + 1) % 4);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [project?.status]);

  const loadingSteps = [
    "Identifying module boundaries...",
    "Tracing logical dependencies...",
    "Synthesizing architectural patterns...",
    "Preparing intelligence dashboard..."
  ];

  const codebaseContext = useMemo(() => {
    if (!files) return "";
    return files.slice(0, 15).map((f) => `FILE: ${f.filePath}\nCONTENT: ${f.fileContent.slice(0, 1000)}...`).join('\n---\n');
  }, [files]);

  const selectedFile = useMemo(() => files?.find(f => f.id === selectedFileId) || null, [files, selectedFileId]);

  const handleFileSelect = (file: any) => {
    setSelectedFileId(file.id);
    setActiveTab('explain');
  };

  if (isProjectLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <Code2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
        </div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Code2 className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <p className="text-muted-foreground text-sm">This repository or analysis session could not be located.</p>
        <Button variant="outline" onClick={() => router.push('/')} className="rounded-full">Return Home</Button>
      </div>
    );
  }

  if (project.status === 'processing') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <div className="max-w-md w-full space-y-12 text-center animate-in fade-in duration-1000">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping duration-1000" />
            <div className="absolute inset-4 bg-primary/30 rounded-full animate-pulse" />
            <div className="relative w-full h-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-headline font-bold text-slate-900 dark:text-white">Neural Synthesis</h2>
            <div className="h-8 relative">
              {loadingSteps.map((step, i) => (
                <p 
                  key={i} 
                  className={`absolute inset-0 text-muted-foreground transition-all duration-500 transform ${
                    loadingStep === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {step}
                </p>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-8 pt-4">
            <div className="flex flex-col items-center gap-2">
               <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border flex items-center justify-center shadow-sm">
                  <Activity className="w-5 h-5 text-primary" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flow</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security</span>
            </div>
            <div className="flex flex-col items-center gap-2">
               <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 text-amber-500" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Logic</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-1000">
        <Sidebar className="border-r border-slate-200 dark:border-slate-800" collapsible="icon">
          <SidebarHeader className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <Code2 className="w-5 h-5 text-primary" />
              <span className="font-headline font-bold text-sm tracking-tight group-data-[collapsible=icon]:hidden">Neuralyze</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 space-y-6">
             <div className="space-y-1 group-data-[collapsible=icon]:hidden animate-in slide-in-from-left-4 duration-700 delay-300 fill-mode-both">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Workspace</p>
                <Button variant={activeTab === 'overview' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 h-9 px-3 rounded-lg" onClick={() => setActiveTab('overview')}>
                  <LayoutDashboard className="w-4 h-4" /> Overview
                </Button>
                <Button variant={activeTab === 'chat' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 h-9 px-3 rounded-lg" onClick={() => setActiveTab('chat')}>
                  <MessageSquare className="w-4 h-4" /> AI Chat
                </Button>
             </div>
             <div className="space-y-1 animate-in slide-in-from-left-4 duration-700 delay-500 fill-mode-both">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2 group-data-[collapsible=icon]:hidden">Repository</p>
                {!files ? <Loader2 className="w-4 h-4 animate-spin mx-auto opacity-50" /> : <FileTree files={files} onSelect={handleFileSelect} />}
             </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0 bg-background">
          <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-20 animate-in slide-in-from-top-4 duration-700 delay-100 fill-mode-both">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="w-3.5 h-3.5 cursor-pointer hover:text-primary transition-colors" onClick={() => router.push('/')} />
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                <span className="font-medium text-foreground">{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" className="h-8 gap-2 rounded-full px-4"><RefreshCw className="w-3.5 h-3.5" /> Re-scan</Button>
              <div className="w-px h-4 bg-border" />
              <Button size="sm" className="h-8 rounded-full px-4" onClick={() => router.push('/')}>New Project</Button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden animate-in fade-in duration-1000 delay-500 fill-mode-both">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 flex items-center justify-between">
                <TabsList className="bg-transparent h-9 p-0 gap-6">
                  <TabsTrigger value="overview" className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-semibold px-1">Dashboard</TabsTrigger>
                  <TabsTrigger value="explain" className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-semibold px-1">Editor</TabsTrigger>
                  <TabsTrigger value="chat" className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-semibold px-1">AI Chat</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   AI Synthesis Active
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden">
                <TabsContent value="overview" className="h-full m-0 focus-visible:ring-0">
                  <ProjectOverviewPanel codebaseContent={codebaseContext} />
                </TabsContent>
                
                <TabsContent value="explain" className="h-full m-0 focus-visible:ring-0">
                  {selectedFile ? (
                    <FileExplainerPanel file={selectedFile} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border animate-in zoom-in duration-500">
                        <FileCode className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="max-w-xs space-y-1 animate-in slide-in-from-bottom-2 duration-700">
                        <h3 className="font-semibold text-lg">Select a file</h3>
                        <p className="text-sm text-muted-foreground">Select a module from the explorer to begin in-depth code analysis.</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="h-full m-0 focus-visible:ring-0">
                  <AIChatPanel selectedFile={selectedFile} />
                </TabsContent>
              </div>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
