"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Code2, Loader2, FileCode, Search, Terminal, ArrowRight, ShieldCheck, Zap, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthDialog } from '@/components/auth/AuthDialog';
import JSZip from 'jszip';

export default function LandingPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [pastedCode, setPastedCode] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const createProjectWithFiles = async (userId: string, projectName: string, files: { path: string, content: string }[]) => {
    const projectId = doc(collection(db, 'temp')).id;
    const projectRef = doc(db, 'users', userId, 'projects', projectId);

    setDocumentNonBlocking(projectRef, {
      id: projectId,
      userId: userId,
      name: projectName,
      status: 'analyzed',
      uploadDate: new Date().toISOString(),
      lastAnalysisDate: new Date().toISOString()
    }, { merge: true });

    await Promise.all(files.map(async (file) => {
      const fileId = doc(collection(db, 'temp')).id;
      const cleanPath = file.path.replace(/^\/+/, '');
      const pathParts = cleanPath.split('/');
      const fileName = pathParts[pathParts.length - 1] || 'unnamed';
      
      const fileRef = doc(db, 'users', userId, 'projects', projectId, 'codeFiles', fileId);
      setDocumentNonBlocking(fileRef, {
        id: fileId,
        projectId: projectId,
        userId: userId,
        filePath: cleanPath,
        fileName: fileName,
        fileContent: file.content,
        fileExtension: fileName.split('.').pop() || '',
        lastAnalyzedDate: new Date().toISOString()
      }, { merge: true });
    }));

    await new Promise(resolve => setTimeout(resolve, 1500));
    router.push(`/dashboard/${projectId}`);
  };

  const handleSnippetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedCode.trim() || !user) return;
    setIsProcessing(true);
    setProcessingStage('Ingesting Snippet');
    try {
      await createProjectWithFiles(user.uid, snippetName || 'Code Snippet', [{ path: 'snippet.txt', content: pastedCode }]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage('Decompressing Archive');
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const projectId = doc(collection(db, 'temp')).id;
      const projectName = file.name.replace('.zip', '');
      const projectRef = doc(db, 'users', user.uid, 'projects', projectId);

      setDocumentNonBlocking(projectRef, {
        id: projectId,
        userId: user.uid,
        name: projectName,
        status: 'processing',
        uploadDate: new Date().toISOString()
      }, { merge: true });

      const filesToProcess = Object.entries(zipContent.files).filter(([path, entry]) => {
        const isDir = entry.dir;
        const isBinary = /\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|exe|dll|so|dylib|bin|pyc|pyo|pyd|class|jar|war|ear|db|sqlite|pdb|msi|woff|woff2|ttf|eot|mp3|mp4|mov|avi|wav|ogg|m4a|7z|rar|dmg|iso|pkg|apk)$/i.test(path);
        const isNodeModules = path.includes('node_modules/') || path.includes('vendor/') || path.includes('.git/');
        return !isDir && !isBinary && !isNodeModules;
      });

      setProcessingStage('Synchronizing Files');
      let processedCount = 0;
      for (const [path, zipEntry] of filesToProcess) {
        const content = await zipEntry.async('string');
        const fileId = doc(collection(db, 'temp')).id;
        const fileRef = doc(db, 'users', user.uid, 'projects', projectId, 'codeFiles', fileId);
        setDocumentNonBlocking(fileRef, {
          id: fileId,
          projectId: projectId,
          userId: user.uid,
          filePath: path,
          fileName: path.split('/').pop() || '',
          fileContent: content,
          fileExtension: path.split('.').pop() || '',
          lastAnalyzedDate: new Date().toISOString()
        }, { merge: true });
        processedCount++;
        setUploadProgress(Math.round((processedCount / filesToProcess.length) * 100));
      }

      setProcessingStage('Finalizing Project');
      setDocumentNonBlocking(projectRef, { status: 'analyzed', lastAnalysisDate: new Date().toISOString() }, { merge: true });
      setTimeout(() => router.push(`/dashboard/${projectId}`), 1000);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>;

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-full max-w-md space-y-12">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-10 h-10 text-primary animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-headline font-bold text-slate-900 dark:text-white">{processingStage}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Preparing your codebase for deep neural analysis...</p>
          </div>

          <div className="space-y-3">
            <Progress value={uploadProgress || 30} className="h-2 w-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>{uploadProgress}% Complete</span>
              <span>Syncing Data</span>
            </div>
          </div>

          <div className="flex justify-center gap-6 pt-4 opacity-50">
            <Zap className="w-5 h-5" />
            <ShieldCheck className="w-5 h-5" />
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
      
      <header className="h-16 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-headline font-bold text-xl tracking-tight">Neuralyze</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? <UserMenu /> : <Button size="sm" onClick={() => setIsAuthOpen(true)} className="rounded-full px-6">Sign In</Button>}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center overflow-x-hidden">
        <section className="py-24 px-6 w-full max-w-5xl text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-slate-900 dark:text-white leading-[1.1] animate-in fade-in slide-in-from-top-10 duration-1000 ease-out fill-mode-both">
              Next-Gen <span className="text-primary">Analysis</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-8 duration-1000 delay-200 ease-out fill-mode-both leading-relaxed">
              Analyze Deeper, Debug Smarter
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
            <Button size="lg" className="px-10 rounded-full h-14 text-lg font-semibold gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={() => user ? window.scrollTo({ top: 600, behavior: 'smooth' }) : setIsAuthOpen(true)}>
              Launch Workspace <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>

        {!user ? (
          <section className="py-12 w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both">
            <Card className="p-10 text-center space-y-8 border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-headline font-bold">Secure Access</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Sign in to securely store your projects and access history in your private cloud workspace.</p>
              </div>
              <Button className="w-full h-12 rounded-full text-base font-bold" onClick={() => setIsAuthOpen(true)}>Get Started Now</Button>
            </Card>
          </section>
        ) : (
          <section className="py-20 w-full max-w-6xl px-6 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both">
            <Card className="hover:border-primary transition-all cursor-pointer group rounded-3xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <Github className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl font-headline font-bold mb-2">GitHub Repo URL</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Directly analyze any public repository by providing its URL.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://github.com/..." 
                    value={githubUrl} 
                    onChange={(e) => setGithubUrl(e.target.value)} 
                    className="h-10 rounded-full bg-white dark:bg-slate-950"
                  />
                  <Button size="sm" className="rounded-full px-5 h-10">Import</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-all cursor-pointer group rounded-3xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden" onClick={() => fileInputRef.current?.click()}>
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <Upload className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl font-headline font-bold mb-2">Upload ZIP File</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Analyze local projects by uploading a compressed archive.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleZipUpload} />
                <Button variant="outline" className="w-full h-10 rounded-full border-slate-300 dark:border-slate-700 group-hover:bg-primary/5">Select Archive</Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-all cursor-pointer group rounded-3xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <FileCode className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-xl font-headline font-bold mb-2">Paste Code</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Instant line-by-line explanation for snippets or individual files.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <Tabs defaultValue="form">
                  <TabsContent value="form" className="m-0 space-y-3">
                    <Input 
                      placeholder="Project Name" 
                      value={snippetName} 
                      onChange={(e) => setSnippetName(e.target.value)} 
                      className="h-10 rounded-full bg-white dark:bg-slate-950"
                    />
                    <Textarea 
                      placeholder="Paste code here..." 
                      className="min-h-[120px] text-xs font-mono rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" 
                      value={pastedCode} 
                      onChange={(e) => setPastedCode(e.target.value)} 
                    />
                    <Button className="w-full h-10 rounded-full" disabled={!pastedCode} onClick={handleSnippetSubmit}>Run Analysis</Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="py-16 border-t bg-white dark:bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-sm text-muted-foreground font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Secure Analysis</div>
            <div className="flex items-center gap-2"><Search className="w-4 h-4 text-blue-500" /> Deep Inspection</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Real-time Audit</div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">© 2024 Neuralyze Intelligence Engine. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
