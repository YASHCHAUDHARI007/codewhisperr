
"use client";

import { useState, useMemo, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileTree } from '@/components/dashboard/FileTree';
import { ProjectOverviewPanel } from '@/components/dashboard/ProjectOverviewPanel';
import { AIChatPanel } from '@/components/dashboard/AIChatPanel';
import { FileExplainerPanel } from '@/components/dashboard/FileExplainerPanel';
import { Code2, LayoutDashboard, MessageSquare, Info, ChevronRight, Loader2, Rocket, Sparkles, Home, Settings, Search, Bug, FileCode, Upload } from 'lucide-react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { UserMenu } from '@/components/auth/UserMenu';

export default function DashboardPage() {
  const { id: projectId } = useParams() as { id: string };
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const projectRef = useMemoFirebase(() => {
    if (!db || !user || !projectId) return null;
    return doc(db, 'users', user.uid, 'projects', projectId);
  }, [db, user, projectId]);

  const filesRef = useMemoFirebase(() => {
    if (!db || !user || !projectId) return null;
    return collection(db, 'users', user.uid, 'projects', projectId, 'codeFiles');
  }, [db, user, projectId]);

  const { data: project, isLoading: isProjectLoading } = useDoc(projectRef);
  const { data: files, isLoading: isFilesLoading } = useCollection(filesRef);

  const codebaseContext = useMemo(() => {
    if (!files) return "";
    return files
      .slice(0, 15)
      .map((f) => `FILE: ${f.filePath}\nCONTENT: ${f.fileContent.slice(0, 1000)}...`)
      .join('\n---\n');
  }, [files]);

  const selectedFile = useMemo(() => {
    return files?.find(f => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  const handleFileSelect = (file: any) => {
    setSelectedFileId(file.id);
    setActiveTab('explain');
  };

  if (isUserLoading || isProjectLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !project) return null;

  if (project.status === 'processing') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0f172a] p-6 text-center space-y-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-b-2 border-primary animate-spin" />
          <Rocket className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center justify-center gap-3">
            Mapping Repository <Sparkles className="text-primary" />
          </h2>
          <p className="text-muted-foreground text-lg italic">
            Parsing modules and synthesizing architectural insights...
          </p>
        </div>
        <Progress value={65} className="w-full max-w-md h-1 bg-white/5" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-[#0f172a] overflow-hidden selection:bg-primary/20">
        <Sidebar className="border-r border-[#1e293b] bg-[#020617]" collapsible="icon">
          <SidebarHeader className="p-4 border-b border-[#1e293b]">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-110 shadow-lg shadow-primary/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h2 className="font-headline font-bold text-white leading-tight">CodeWhisperr</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Intelligence v2.0</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 overflow-y-auto space-y-4">
             <div className="px-2 space-y-2 group-data-[collapsible=icon]:hidden">
                <h3 className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 px-2">Navigation</h3>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 h-9" onClick={() => setActiveTab('overview')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-white hover:bg-white/5 h-9" onClick={() => setActiveTab('chat')}>
                  <MessageSquare className="w-4 h-4" />
                  Ask AI
                </Button>
             </div>

             <div className="px-2 space-y-2">
                <h3 className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50 px-2 group-data-[collapsible=icon]:hidden">Explorer</h3>
                {!files ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mt-4 text-primary/50" />
                ) : (
                  <FileTree files={files} onSelect={handleFileSelect} />
                )}
             </div>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-[#1e293b]">
             <Button variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest gap-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                <Upload className="w-4 h-4" />
                <span className="group-data-[collapsible=icon]:hidden">New Project</span>
             </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-[#0f172a]">
          <header className="h-14 border-b border-[#1e293b] flex items-center justify-between px-6 bg-[#020617]/50 backdrop-blur-xl z-20 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-white" />
              <div className="flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-muted-foreground/50 cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/')} />
                <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
                <span className="text-white font-semibold tracking-tight">{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] h-8 px-4 shadow-lg shadow-primary/20">
                Run AI Analysis
              </Button>
              <div className="h-6 w-px bg-white/10 mx-2" />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 py-3 flex items-center justify-between border-b border-[#1e293b] bg-[#020617]/30 shrink-0">
                <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl">
                  <TabsTrigger value="overview" className="gap-2 px-4 rounded-lg text-xs uppercase tracking-widest font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LayoutDashboard className="w-4 h-4" />
                    Project
                  </TabsTrigger>
                  <TabsTrigger value="explain" className="gap-2 px-4 rounded-lg text-xs uppercase tracking-widest font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Info className="w-4 h-4" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2 px-4 rounded-lg text-xs uppercase tracking-widest font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <MessageSquare className="w-4 h-4" />
                    AI Chat
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-50">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Neural Engine Online
                   </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 relative">
                <TabsContent value="overview" className="h-full m-0 focus-visible:ring-0">
                  <ProjectOverviewPanel codebaseContent={codebaseContext} />
                </TabsContent>
                
                <TabsContent value="explain" className="h-full m-0 focus-visible:ring-0">
                  {selectedFile ? (
                    <FileExplainerPanel file={selectedFile} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-8 animate-in fade-in zoom-in-95">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-[#020617] flex items-center justify-center border border-[#1e293b] shadow-2xl">
                        <FileCode className="w-10 h-10 text-primary/30" />
                      </div>
                      <div className="max-w-md space-y-3">
                        <h3 className="text-3xl font-headline font-bold text-white tracking-tight">Select a Module</h3>
                        <p className="text-muted-foreground leading-relaxed">Choose a source file from the repository explorer to begin AI-powered structural analysis and debugging.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                         <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                            <Search className="w-4 h-4 text-primary mb-2" />
                            <p className="text-[10px] font-bold uppercase text-white/40">Explanation</p>
                            <p className="text-xs text-muted-foreground">Deep code understanding</p>
                         </div>
                         <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                            <Bug className="w-4 h-4 text-accent mb-2" />
                            <p className="text-[10px] font-bold uppercase text-white/40">Audit</p>
                            <p className="text-xs text-muted-foreground">Identify logic risks</p>
                         </div>
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
