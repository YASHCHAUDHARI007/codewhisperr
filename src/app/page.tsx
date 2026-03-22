
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Zap, Shield, Search, Code2, Loader2, CheckCircle2, FileCode, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { fetchGithubRepo } from '@/app/actions/github';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { UserMenu } from '@/components/auth/UserMenu';
import JSZip from 'jszip';

export default function LandingPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [pastedCode, setPastedCode] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const ensureAuth = async () => {
    if (!user) {
      setIsAuthDialogOpen(true);
      return null;
    }
    return user.uid;
  };

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
    if (!pastedCode.trim()) return;

    const userId = await ensureAuth();
    if (!userId) return;

    setIsProcessing(true);
    setProcessingStage('Creating project from snippet...');
    
    try {
      await createProjectWithFiles(userId, snippetName || 'Code Snippet', [
        { path: 'snippet.txt', content: pastedCode }
      ]);
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleSingleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = await ensureAuth();
    if (!userId) return;

    setIsProcessing(true);
    setProcessingStage('Reading file content...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        await createProjectWithFiles(userId, file.name, [
          { path: file.name, content: content }
        ]);
      };
      reader.readAsText(file);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = await ensureAuth();
    if (!userId) return;

    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage('Extracting ZIP content...');
    
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      const projectId = doc(collection(db, 'temp')).id;
      const projectName = file.name.replace('.zip', '');

      const projectRef = doc(db, 'users', userId, 'projects', projectId);
      setDocumentNonBlocking(projectRef, {
        id: projectId,
        userId: userId,
        name: projectName,
        status: 'processing',
        uploadDate: new Date().toISOString(),
        uploadFileName: file.name
      }, { merge: true });

      const filesToProcess = Object.entries(zipContent.files).filter(([path, entry]) => {
        const isDir = entry.dir;
        const isHidden = path.split('/').some(part => part.startsWith('.') && part !== '.');
        const isBinary = /\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|exe|dll|so|dylib|bin|pyc|pyo|pyd|class|jar|war|ear|db|sqlite|pdb|msi|woff|woff2|ttf|eot|mp3|mp4|mov|avi|wav|ogg|m4a|7z|rar|dmg|iso|pkg|apk)$/i.test(path);
        const isNodeModules = path.includes('node_modules/') || path.includes('vendor/') || path.includes('.git/');
        return !isDir && !isHidden && !isBinary && !isNodeModules;
      });

      let processedCount = 0;
      for (const [path, zipEntry] of filesToProcess) {
        const content = await zipEntry.async('string');
        if (content.length < 800000) {
          const fileId = doc(collection(db, 'temp')).id;
          const fileRef = doc(db, 'users', userId, 'projects', projectId, 'codeFiles', fileId);
          setDocumentNonBlocking(fileRef, {
            id: fileId,
            projectId: projectId,
            userId: userId,
            filePath: path,
            fileName: path.split('/').pop() || '',
            fileContent: content,
            fileExtension: path.split('.').pop() || '',
            lastAnalyzedDate: new Date().toISOString()
          }, { merge: true });
        }
        processedCount++;
        setUploadProgress(Math.round((processedCount / filesToProcess.length) * 100));
      }

      setDocumentNonBlocking(projectRef, { status: 'analyzed', lastAnalysisDate: new Date().toISOString() }, { merge: true });
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/dashboard/${projectId}`);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleGithubIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) return;

    const userId = await ensureAuth();
    if (!userId) return;

    setIsProcessing(true);
    setProcessingStage('Validating Repository URL...');

    try {
      const url = githubUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');
      const parts = url.split('/');
      let owner = '', repo = '';

      if (url.includes('github.com')) {
        const githubIndex = parts.indexOf('github.com');
        owner = parts[githubIndex + 1];
        repo = parts[githubIndex + 2];
      } else {
        owner = parts[parts.length - 2];
        repo = parts[parts.length - 1];
      }

      const result = await fetchGithubRepo(owner, repo);
      if (!result.success) throw new Error(result.error);

      const zip = new JSZip();
      const content = await zip.loadAsync(result.data!, { base64: true });
      
      const projectId = doc(collection(db, 'temp')).id;
      const projectRef = doc(db, 'users', userId, 'projects', projectId);
      
      setDocumentNonBlocking(projectRef, {
        id: projectId,
        userId: userId,
        name: repo,
        status: 'processing',
        uploadDate: new Date().toISOString(),
        sourceUrl: githubUrl
      }, { merge: true });

      const filesToProcess = Object.entries(content.files).filter(([path, entry]) => {
        return !entry.dir && !path.includes('node_modules/') && !path.includes('.git/');
      });

      let processedCount = 0;
      for (const [path, entry] of filesToProcess) {
        const fileContent = await entry.async('string');
        const fileId = doc(collection(db, 'temp')).id;
        const fileRef = doc(db, 'users', userId, 'projects', projectId, 'codeFiles', fileId);
        setDocumentNonBlocking(fileRef, {
          id: fileId,
          projectId: projectId,
          userId: userId,
          filePath: path,
          fileName: path.split('/').pop() || '',
          fileContent: fileContent,
          fileExtension: path.split('.').pop() || '',
          lastAnalyzedDate: new Date().toISOString()
        }, { merge: true });
        processedCount++;
        setUploadProgress(Math.round((processedCount / filesToProcess.length) * 100));
      }

      setDocumentNonBlocking(projectRef, { status: 'analyzed', lastAnalysisDate: new Date().toISOString() }, { merge: true });
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/dashboard/${projectId}`);
    } catch (error: any) {
      toast({ title: "Ingestion Failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">Processing Code</h2>
          <p className="text-muted-foreground">{processingStage}</p>
        </div>
        <div className="w-full max-w-md space-y-4">
          <Progress value={uploadProgress || 50} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 py-20 relative">
      <div className="absolute top-6 right-6 z-50">
        {user ? <UserMenu /> : <Button variant="outline" onClick={() => setIsAuthDialogOpen(true)}>Sign In</Button>}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl space-y-16 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Code Intelligence</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-headline font-bold text-white tracking-tight leading-tight">
            Understand any <span className="text-primary">code</span> <br /> in seconds.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CodeWhisper maps, explains, and audits your projects via ZIP, GitHub, or direct code input.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 bg-card/50 border-white/5 hover:border-primary/50 transition-all flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-headline font-semibold">Project ZIP</h3>
              <p className="text-sm text-muted-foreground">Upload full repositories for deep architectural mapping.</p>
            </div>
            <input type="file" accept=".zip" className="hidden" ref={fileInputRef} onChange={handleZipUpload} />
            <Button variant="outline" className="w-full border-white/10" onClick={() => fileInputRef.current?.click()}>
              Select ZIP
            </Button>
          </Card>

          <Card className="p-8 bg-card/50 border-white/5 hover:border-accent/50 transition-all flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-2xl bg-accent/10">
              <Github className="w-8 h-8 text-accent" />
            </div>
            <form onSubmit={handleGithubIngest} className="w-full space-y-4 flex flex-col flex-1">
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-semibold">GitHub Repo</h3>
                <p className="text-sm text-muted-foreground">Import public projects directly from URL.</p>
              </div>
              <Input placeholder="URL..." className="bg-background/50 border-white/10" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
              <Button className="w-full bg-accent text-accent-foreground mt-auto" type="submit" disabled={!githubUrl}>
                Analyze Repo
              </Button>
            </form>
          </Card>

          <Card className="p-8 bg-card/50 border-white/5 hover:border-white/20 transition-all flex flex-col items-center text-center space-y-6 overflow-hidden">
            <div className="p-4 rounded-2xl bg-muted/50">
              <FileCode className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="w-full flex-1 flex flex-col">
              <div className="space-y-2 mb-4">
                <h3 className="text-xl font-headline font-semibold">Quick Analysis</h3>
                <p className="text-sm text-muted-foreground">Paste code or upload a single text/code file.</p>
              </div>
              
              <Tabs defaultValue="paste" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-background/50 mb-4">
                  <TabsTrigger value="paste" className="text-xs">Paste</TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs">File</TabsTrigger>
                </TabsList>
                
                <TabsContent value="paste" className="space-y-3 mt-0">
                  <Input 
                    placeholder="Project name..." 
                    className="bg-background/50 border-white/10 text-xs h-8"
                    value={snippetName}
                    onChange={(e) => setSnippetName(e.target.value)}
                  />
                  <Textarea 
                    placeholder="Paste your code here..." 
                    className="bg-background/50 border-white/10 min-h-[100px] text-xs font-code"
                    value={pastedCode}
                    onChange={(e) => setPastedCode(e.target.value)}
                  />
                  <Button size="sm" className="w-full" disabled={!pastedCode} onClick={handleSnippetSubmit}>
                    Run Analysis
                  </Button>
                </TabsContent>
                
                <TabsContent value="upload" className="mt-0">
                  <div className="py-10 border-2 border-dashed border-white/5 rounded-lg hover:border-white/10 transition-colors cursor-pointer" onClick={() => singleFileInputRef.current?.click()}>
                    <FileText className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Click to select file</p>
                    <input type="file" className="hidden" ref={singleFileInputRef} onChange={handleSingleFileUpload} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>

        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground text-sm">
            {[
              { icon: CheckCircle2, label: "Secure Analysis" },
              { icon: Search, label: "Deep Inspection" },
              { icon: Code2, label: "Multi-language Support" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-primary" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AuthDialog isOpen={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />
    </div>
  );
}
