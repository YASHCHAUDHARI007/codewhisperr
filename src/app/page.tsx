
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Zap, Shield, Search, ArrowRight, Code2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useAuth, useUser, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import JSZip from 'jszip';

export default function LandingPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser();

  const ensureAuth = async () => {
    if (!user) {
      initiateAnonymousSignIn(auth);
      // We don't await because it's non-blocking, but the provider will update state.
      // For the sake of the next immediate operation, we wait a beat or let the user try again.
      return null;
    }
    return user.uid;
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = await ensureAuth();
    if (!userId) {
      toast({ title: "Signing you in...", description: "Please try uploading again in a second." });
      return;
    }

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const projectId = doc(collection(db, 'temp')).id;
      const projectName = file.name.replace('.zip', '');

      // Create Project Doc
      const projectRef = doc(db, 'users', userId, 'projects', projectId);
      setDocumentNonBlocking(projectRef, {
        id: projectId,
        userId: userId,
        name: projectName,
        status: 'processing',
        uploadDate: new Date().toISOString(),
        uploadFileName: file.name
      }, { merge: true });

      // Process files
      const filePromises: Promise<void>[] = [];
      for (const [path, zipEntry] of Object.entries(content.files)) {
        if (!zipEntry.dir) {
          filePromises.push((async () => {
            const fileContent = await zipEntry.async('string');
            const fileId = doc(collection(db, 'temp')).id;
            const fileRef = doc(db, 'users', userId, 'projects', projectId, 'codeFiles', fileId);
            setDocumentNonBlocking(fileRef, {
              id: fileId,
              projectId: projectId,
              userId: userId,
              filePath: path,
              fileName: path.split('/').pop() || '',
              fileContent: fileContent,
              fileExtension: path.split('.').pop() || ''
            }, { merge: true });
          })());
        }
      }

      await Promise.all(filePromises);
      
      setDocumentNonBlocking(projectRef, { status: 'analyzed' }, { merge: true });
      router.push(`/dashboard/${projectId}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Upload Failed", description: "Could not process the ZIP file.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGithubIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) return;

    const userId = await ensureAuth();
    if (!userId) return;

    setIsProcessing(true);
    try {
      // Basic GitHub API fetch (public repos)
      // Format: https://github.com/owner/repo
      const parts = githubUrl.split('/');
      const owner = parts[parts.length - 2];
      const repo = parts[parts.length - 1];

      if (!owner || !repo) throw new Error("Invalid GitHub URL");

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (!response.ok) throw new Error("Repo not found or private");
      
      const contents = await response.json();
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

      // Recursive fetch would be better, but for MVP we fetch top-level or files we can see
      for (const item of contents) {
        if (item.type === 'file') {
          const fileRes = await fetch(item.download_url);
          const fileContent = await fileRes.text();
          const fileId = doc(collection(db, 'temp')).id;
          const fileRef = doc(db, 'users', userId, 'projects', projectId, 'codeFiles', fileId);
          setDocumentNonBlocking(fileRef, {
            id: fileId,
            projectId: projectId,
            userId: userId,
            filePath: item.path,
            fileName: item.name,
            fileContent: fileContent,
            fileExtension: item.name.split('.').pop() || ''
          }, { merge: true });
        }
      }

      setDocumentNonBlocking(projectRef, { status: 'analyzed' }, { merge: true });
      router.push(`/dashboard/${projectId}`);
    } catch (error: any) {
      toast({ title: "Ingestion Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

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
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Select File"}
              {isProcessing ? "Processing..." : "Select File"}
            </Button>
          </Card>

          <Card className="p-8 bg-card/50 border-white/5 hover:border-accent/50 transition-all group flex flex-col items-center justify-between text-center space-y-6">
            <div className="p-4 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Github className="w-10 h-10 text-accent" />
            </div>
            <form onSubmit={handleGithubIngest} className="w-full space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-semibold">GitHub Repo</h3>
                <p className="text-sm text-muted-foreground">Clone and analyze public repositories.</p>
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
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Analyze Repo"}
                {isProcessing ? "Processing..." : "Analyze Repo"}
              </Button>
            </form>
          </Card>
        </div>

        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Deep Inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>Tech Stack Auto-Detection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
