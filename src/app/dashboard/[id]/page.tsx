"use client";

import { useState, useMemo, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileTree } from '@/components/dashboard/FileTree';
import { ProjectOverviewPanel } from '@/components/dashboard/ProjectOverviewPanel';
import { AIChatPanel } from '@/components/dashboard/AIChatPanel';
import { FileExplainerPanel } from '@/components/dashboard/FileExplainerPanel';
import { Code2, LayoutDashboard, MessageSquare, Info, ChevronRight, Loader2, Rocket, Sparkles, Home, Settings } from 'lucide-react';
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
      .slice(0, 15) // More context for better analysis
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
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !project) return null;

  if (project.status === 'processing') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-6 text-center space-y-12">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-b-2 border-primary animate-spin" />
          <Rocket className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-4xl font-headline font-bold text-white tracking-tight flex items-center justify-center gap-3">
            Analyzing Architecture <Sparkles className="text-primary" />
          </h2>
          <p className="text-muted-foreground text-lg">
            Decomposing modules and mapping dependencies.
          </p>
        </div>
        <Progress value={65} className="w-full max-w-md h-1" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20">
        <Sidebar className="border-r border-border bg-sidebar" collapsible="icon">
          <SidebarHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-110">
                <Code2 className="w-5 h-5" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h2 className="font-headline font-bold text-white leading-tight">CodeWhisper</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Intelligence v1.0</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 overflow-y-auto">
            {!files ? (
               <Loader2 className="w-4 h-4 animate-spin mx-auto mt-4" />
            ) : (
              <FileTree files={files} onSelect={handleFileSelect} />
            )}
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background">
          <header className="h-14 border-b border-border flex items-center justify-between px-6 glass z-10 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-white" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground cursor-pointer hover:text-white transition-colors" onClick={() => router.push('/')}>
                   <Home className="w-4 h-4" />
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                <span className="text-white font-medium">{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                <Settings className="w-4 h-4" />
              </Button>
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 py-4 flex items-center justify-between border-b border-border glass shrink-0">
                <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl">
                  <TabsTrigger value="overview" className="gap-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LayoutDashboard className="w-4 h-4" />
                    Project Overview
                  </TabsTrigger>
                  <TabsTrigger value="explain" className="gap-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Info className="w-4 h-4" />
                    File Insights
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2 px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Ask AI
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-xs">
                     Refine Analysis
                  </Button>
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
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Info className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <div className="max-w-sm space-y-2">
                        <h3 className="text-2xl font-headline font-bold text-white">Select a source file</h3>
                        <p className="text-sm text-muted-foreground">Browse your repository in the sidebar and select a file to generate detailed AI explanations.</p>
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
