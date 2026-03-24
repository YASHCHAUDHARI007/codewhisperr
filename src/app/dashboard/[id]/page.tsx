"use client";

import { useState, useMemo, useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileTree } from '@/components/dashboard/FileTree';
import { ProjectOverviewPanel } from '@/components/dashboard/ProjectOverviewPanel';
import { FileExplainerPanel } from '@/components/dashboard/FileExplainerPanel';
import { Code2, LayoutDashboard, MessageSquare, Info, ChevronRight, Loader2, Home, Search, FileCode, Bug, RefreshCw } from 'lucide-react';
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
    if (!isUserLoading && !user) router.push('/');
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
    return files.slice(0, 15).map((f) => `FILE: ${f.filePath}\nCONTENT: ${f.fileContent.slice(0, 1000)}...`).join('\n---\n');
  }, [files]);

  const selectedFile = useMemo(() => files?.find(f => f.id === selectedFileId) || null, [files, selectedFileId]);

  const handleFileSelect = (file: any) => {
    setSelectedFileId(file.id);
    setActiveTab('explain');
  };

  if (isUserLoading || isProjectLoading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!user || !project) return null;

  if (project.status === 'processing') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Analyzing Repository</h2>
          <p className="text-muted-foreground">Identifying modules and synthesizing logic flow...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Sidebar className="border-r" collapsible="icon">
          <SidebarHeader className="h-14 flex items-center px-4 border-b">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <Code2 className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm tracking-tight group-data-[collapsible=icon]:hidden">CodeWhisperr</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 space-y-6">
             <div className="space-y-1 group-data-[collapsible=icon]:hidden">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">Workspace</p>
                <Button variant={activeTab === 'overview' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 h-9 px-3" onClick={() => setActiveTab('overview')}>
                  <LayoutDashboard className="w-4 h-4" /> Overview
                </Button>
                <Button variant={activeTab === 'chat' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 h-9 px-3" onClick={() => setActiveTab('chat')}>
                  <MessageSquare className="w-4 h-4" /> AI Chat
                </Button>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2 group-data-[collapsible=icon]:hidden">Repository</p>
                {!files ? <Loader2 className="w-4 h-4 animate-spin mx-auto opacity-50" /> : <FileTree files={files} onSelect={handleFileSelect} />}
             </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col min-w-0 bg-background">
          <header className="h-14 border-b flex items-center justify-between px-6 bg-white dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="w-3.5 h-3.5 cursor-pointer hover:text-primary transition-colors" onClick={() => router.push('/')} />
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                <span className="font-medium text-foreground">{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" className="h-8 gap-2"><RefreshCw className="w-3.5 h-3.5" /> Re-scan</Button>
              <div className="w-px h-4 bg-border" />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 py-2 border-b bg-slate-50 dark:bg-slate-900/20 flex items-center justify-between">
                <TabsList className="bg-transparent h-9 p-0 gap-6">
                  <TabsTrigger value="overview" className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-semibold px-1">Dashboard</TabsTrigger>
                  <TabsTrigger value="explain" className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-xs font-semibold px-1">Editor</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border">
                        <FileCode className="w-8 h-8 text-slate-400" />
                      </div>
                      <div className="max-w-xs space-y-1">
                        <h3 className="font-semibold text-lg">Select a file</h3>
                        <p className="text-sm text-muted-foreground">Select a module from the explorer to begin in-depth code analysis.</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}