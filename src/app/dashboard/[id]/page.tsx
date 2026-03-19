
"use client";

import { useState, useMemo } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileTree } from '@/components/dashboard/FileTree';
import { ProjectOverviewPanel } from '@/components/dashboard/ProjectOverviewPanel';
import { AIChatPanel } from '@/components/dashboard/AIChatPanel';
import { FileExplainerPanel } from '@/components/dashboard/FileExplainerPanel';
import { Code2, LayoutDashboard, MessageSquare, Info, ChevronRight, Loader2 } from 'lucide-react';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useParams } from 'next/navigation';

export default function DashboardPage() {
  const { id: projectId } = useParams() as { id: string };
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

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

  const codebaseText = useMemo(() => {
    if (!files) return "";
    return files
      .map((f) => `FILE: ${f.filePath}\nCONTENT:\n${f.fileContent}\n---`)
      .join('\n');
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

  if (!project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <Button onClick={() => window.location.href = '/'}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-white/5">
          <SidebarHeader className="p-4 border-b border-white/5 flex flex-row items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-white leading-tight">CodeWhisper</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Project Explorer</p>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            {!files ? (
               <Loader2 className="w-4 h-4 animate-spin mx-auto mt-4" />
            ) : (
              <FileTree files={files} onSelect={handleFileSelect} />
            )}
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Dashboard</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-white font-medium">{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/5 bg-white/5 text-xs font-medium">
                Save Analysis
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground text-xs font-medium">
                Export Map
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-hidden p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-card/50 border border-white/5 p-1">
                  <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <LayoutDashboard className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="explain" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Info className="w-4 h-4" />
                    Explain File
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <MessageSquare className="w-4 h-4" />
                    Ask AI
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <TabsContent value="overview" className="h-full mt-0 focus-visible:ring-0">
                  <ProjectOverviewPanel codebaseContent={codebaseText} />
                </TabsContent>
                
                <TabsContent value="explain" className="h-full mt-0 focus-visible:ring-0">
                  {selectedFile ? (
                    <FileExplainerPanel file={selectedFile} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Info className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="max-w-xs">
                        <h3 className="text-lg font-headline font-semibold">No file selected</h3>
                        <p className="text-sm text-muted-foreground">Select a file from the explorer on the left to see its AI explanation.</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="h-full mt-0 focus-visible:ring-0">
                  <AIChatPanel codebaseContent={codebaseText} />
                </TabsContent>
              </div>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
