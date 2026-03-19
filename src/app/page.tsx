"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Github, Zap, Shield, Search, ArrowRight, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function LandingPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleDemo = () => {
    setIsUploading(true);
    setTimeout(() => {
      router.push('/dashboard/demo');
    }, 1500);
  };

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a valid GitHub repository URL.",
        variant: "destructive"
      });
      return;
    }
    setIsUploading(true);
    // In a real app, we'd trigger the backend ingestion here
    setTimeout(() => {
      router.push('/dashboard/demo');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background Glow */}
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
            <Button 
              variant="outline" 
              className="w-full border-white/10 hover:bg-white/5"
              onClick={handleDemo}
              disabled={isUploading}
            >
              Select File
            </Button>
          </Card>

          <Card className="p-8 bg-card/50 border-white/5 hover:border-accent/50 transition-all group flex flex-col items-center justify-between text-center space-y-6">
            <div className="p-4 rounded-2xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Github className="w-10 h-10 text-accent" />
            </div>
            <form onSubmit={handleIngest} className="w-full space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-semibold">GitHub Repo</h3>
                <p className="text-sm text-muted-foreground">Clone and analyze public or private repositories.</p>
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
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Analyze Repo"}
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
              <span>Deep Inpection</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>Tech Stack Auto-Detection</span>
            </div>
          </div>
        </div>

        <Button 
          variant="link" 
          className="text-muted-foreground hover:text-white"
          onClick={handleDemo}
        >
          Try Demo Project <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}