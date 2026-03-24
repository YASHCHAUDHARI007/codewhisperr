"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Code2, Loader2, FileCode, Search, Terminal, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
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

    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push(`/dashboard/${projectId}`);
  };

  const handleSnippetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedCode.trim() || !user) return;
    setIsProcessing(true);
    setProcessingStage('Analyzing snippet...');
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
    setProcessingStage('Parsing ZIP archive...');
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

      setDocumentNonBlocking(projectRef, { status: 'analyzed', lastAnalysisDate: new Date().toISOString() }, { merge: true });
      router.push(`/dashboard/${projectId}`);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">{processingStage}</h2>
          <p className="text-muted-foreground">Preparing codebase for intelligence synthesis...</p>
        </div>
        <Progress value={uploadProgress || 30} className="w-full max-w-sm h-1.5" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />
      
      <header className="h-16 border-b bg-white dark:bg-slate-950 sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">CodeWhisperr</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">Docs</Button>
          <Button variant="ghost" size="sm">Pricing</Button>
          <div className="w-px h-4 bg-border mx-2" />
          {user ? <UserMenu /> : <Button size="sm" onClick={() => setIsAuthOpen(true)}>Sign In</Button>}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <section className="py-24 px-6 w-full max-w-5xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-headline font-bold text-slate-900 dark:text-white leading-tight">
              AI Codebase Explainer & Debugger
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
              Understand unfamiliar code faster with professional-grade AI analysis. Map architectures, audit security, and optimize performance in seconds.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" className="px-8 gap-2" onClick={() => user ? window.scrollTo({ top: 800, behavior: 'smooth' }) : setIsAuthOpen(true)}>
              Start Analysis <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="px-8">Try Demo</Button>
          </div>
        </section>

        {!user ? (
          <section className="py-12 w-full max-w-md px-6">
            <Card className="p-8 text-center space-y-6">
              <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Sign in to continue</h3>
                <p className="text-sm text-muted-foreground">Secure your projects and access history with our unified dashboard.</p>
              </div>
              <Button className="w-full" onClick={() => setIsAuthOpen(true)}>Get Started</Button>
            </Card>
          </section>
        ) : (
          <section className="py-20 w-full max-w-6xl px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:border-primary transition-colors cursor-pointer group">
              <CardHeader>
                <Github className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors mb-2" />
                <CardTitle>GitHub Repository URL</CardTitle>
                <CardDescription>Directly analyze any public repository by providing its URL.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="https://github.com/..." value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
                  <Button size="sm">Import</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <CardHeader>
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors mb-2" />
                <CardTitle>Upload ZIP File</CardTitle>
                <CardDescription>Analyze local projects by uploading a compressed archive.</CardDescription>
              </CardHeader>
              <CardContent>
                <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleZipUpload} />
                <Button variant="outline" className="w-full">Select Archive</Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer group">
              <CardHeader>
                <FileCode className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors mb-2" />
                <CardTitle>Paste Code</CardTitle>
                <CardDescription>Instant line-by-line explanation for snippets or individual files.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="form">
                  <TabsContent value="form" className="m-0 space-y-2">
                    <Input placeholder="Project Name" value={snippetName} onChange={(e) => setSnippetName(e.target.value)} />
                    <Textarea placeholder="Paste code here..." className="min-h-[100px] text-xs font-mono" value={pastedCode} onChange={(e) => setPastedCode(e.target.value)} />
                    <Button className="w-full" disabled={!pastedCode} onClick={handleSnippetSubmit}>Run Analysis</Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="py-12 border-t bg-white dark:bg-slate-950 text-center">
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Secure Analysis</div>
          <div className="flex items-center gap-1.5"><Search className="w-4 h-4" /> Deep Inspection</div>
          <div className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Real-time Audit</div>
        </div>
      </footer>
    </div>
  );
}