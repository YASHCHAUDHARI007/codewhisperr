"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Zap, Shield, Search, Code2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useAuth, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { fetchGithubRepo } from '@/app/actions/github';
import JSZip from 'jszip';

export default function LandingPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();

  const ensureAuth = async () => {
    if (!user && !auth.currentUser) {
      initiateAnonymousSignIn(auth);
      // Give it a moment to initialize auth state
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!auth.currentUser) return null;
    }
    return auth.currentUser?.uid || user?.uid || null;
  };

  const processZipContent = async (zipContent: JSZip, projectId: string, projectName: string, userId: string) => {
    // Filter files: Skip directories, hidden files, binaries, and lock files
    const filesToProcess = Object.entries(zipContent.files).filter(([path, entry]) => {
      const isDir = entry.dir;
      const isHidden = path.split('/').some(part => part.startsWith('.') && part !== '.');
      const isBinary = /\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|exe|dll|so|dylib|bin|pyc|woff|woff2|ttf|eot)$/i.test(path);
      const isLockFile = path.endsWith('package-lock.json') || path.endsWith('yarn.lock') || path.endsWith('pnpm-lock.yaml');
      const isNodeModules = path.includes('node_modules/');
      return !isDir && !isHidden && !isBinary && !isLockFile && !isNodeModules;
    });

    const totalFiles = filesToProcess.length;
    if (totalFiles === 0) {
      throw new Error("No readable code files found in the repository.");
    }

    let processedCount = 0;
    setProcessingStage(`Uploading ${totalFiles} code files...`);

    // Process in batches to stay efficient and avoid rate limits
    const BATCH_SIZE = 15;
    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      const batch = filesToProcess.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async ([path, zipEntry]) => {
        try {
          const fileContent = await zipEntry.async('string');
          
          // Firestore document limit is 1MB. We keep it under 800KB for safety.
          if (fileContent.length > 800000) {
            console.warn(`Skipping ${path}: File too large (>800KB).`);
            processedCount++;
            return;
          }

          const fileId = doc(collection(db, 'temp')).id;
          const cleanPath = path.replace(/^\/+/, '');
          const pathParts = cleanPath.split('/');

          const fileRef = doc(db, 'users', userId, 'projects', projectId, 'codeFiles', fileId);
          
          setDocumentNonBlocking(fileRef, {
            id: fileId,
            projectId: projectId,
            userId: userId,
            filePath: cleanPath,
            fileName: pathParts[pathParts.length - 1] || '',
            fileContent: fileContent,
            fileExtension: cleanPath.split('.').pop() || '',
            lastAnalyzedDate: new Date().toISOString()
          }, { merge: true });
          
          processedCount++;
          // Update progress based on total files
          setUploadProgress(Math.round((processedCount / totalFiles) * 100));
        } catch (err) {
          console.error(`Error processing file ${path}:`, err);
        }
      }));
    }

    setProcessingStage('Finalizing analysis...');
    const projectRef = doc(db, 'users', userId, 'projects', projectId);
    setDocumentNonBlocking(projectRef, { 
      status: 'analyzed',
      lastAnalysisDate: new Date().toISOString()
    }, { merge: true });
    
    // Give Firestore a moment to sync before redirecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push(`/dashboard/${projectId}`);
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = await ensureAuth();
    if (!userId) {
      toast({ title: "Authentication required", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage('Extracting ZIP content...');
    
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
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

      await processZipContent(content, projectId, projectName, userId);
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message || "Could not process the ZIP file.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const handleGithubIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) return;

    const userId = await ensureAuth();
    if (!userId) {
      toast({ title: "Authentication required", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setProcessingStage('Validating Repository URL...');

    try {
      // Clean up URL
      const url = githubUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');
      const parts = url.split('/');
      
      let owner = '';
      let repo = '';

      if (url.includes('github.com')) {
        const githubIndex = parts.indexOf('github.com');
        owner = parts[githubIndex + 1];
        repo = parts[githubIndex + 2];
      } else {
        owner = parts[parts.length - 2];
        repo = parts[parts.length - 1];
      }

      if (!owner || !repo) {
        throw new Error("Invalid URL. Expected format: https://github.com/user/repo");
      }

      setProcessingStage(`Fetching ${owner}/${repo} from GitHub...`);
      
      // Call Server Action to fetch ZIP (bypasses CORS)
      const result = await fetchGithubRepo(owner, repo);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setProcessingStage('Extracting repository structure...');
      const zip = new JSZip();
      // Load from base64 string
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

      await processZipContent(content, projectId, repo, userId);
    } catch (error: any) {
      toast({ 
        title: "Ingestion Failed", 
        description: error.message || "An unexpected error occurred.", 
        variant: "destructive" 
      });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-3xl animate-pulse" />
        </div>
        
        <div className="space-y-2 max-w-md">
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">Processing Codebase</h2>
          <p className="text-muted-foreground">{processingStage}</p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <Progress value={uploadProgress} className="h-2" />
          <div className="flex justify-between text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <span>{uploadProgress}% Complete</span>
            <span>Optimizing Assets</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg pt-8">
          {[
            { icon: Shield, label: "Secure Transfer" },
            { icon: Zap, label: "AI Mapping" },
            { icon: Code2, label: "Stack Detection" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
              <item.icon className="w-5 h-5 text-primary/60" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Code Intelligence</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-headline font-bold text-white tracking-tight leading-tight">
            Understand any <span className="text-primary">codebase</span> <br /> in seconds.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your ZIP file or paste a GitHub link. CodeWhisper uses advanced AI to map, explain, and audit your entire project architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card className="p-8 bg-card/50 border-white/5 hover:border-primary/50 transition-all group flex flex-col items-center justify-between text-center space-y-6">
            <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-headline font-semibold">Upload ZIP</h3>
              <p className="text-sm text-muted-foreground">Directly analyze local projects or legacy codebases.</p>
            </div>
            <input 
              type="file" 
              accept=".zip" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleZipUpload}
            />
            <Button 
              variant="outline" 
              className="w-full border-white/10 hover:bg-white/5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              Select File
            </Button>
          </Card>

          <Card className="p-8 bg-card/50 border-white/5 hover:border-accent/50 transition-all group flex flex-col items-center justify-between text-center space-y-6">
            <div className="p-4 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Github className="w-10 h-10 text-accent" />
            </div>
            <form onSubmit={handleGithubIngest} className="w-full space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-semibold">GitHub Repo</h3>
                <p className="text-sm text-muted-foreground">Analyze public repositories via URL.</p>
              </div>
              <Input 
                placeholder="https://github.com/user/repo" 
                className="bg-background/50 border-white/10"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                type="submit"
                disabled={isProcessing || !githubUrl}
              >
                Analyze Repo
              </Button>
            </form>
          </Card>
        </div>

        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Secure Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Deep Inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>Tech Stack Detection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
