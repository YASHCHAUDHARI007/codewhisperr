"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatPanel({ selectedFile }: { selectedFile?: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! Ask me anything. I can focus on your selected file or help with general architecture.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Prepare assistant placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const context = selectedFile 
        ? `CURRENT FILE: ${selectedFile.filePath}\nCONTENT: ${selectedFile.fileContent.slice(0, 4000)}` 
        : "No specific file selected. Help generally.";

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          systemPrompt: "You are an AI assistant helping a developer. Be extremely concise and direct.",
          prompt: `Context:\n${context}\n\nUser Question:\n${userMessage}`,
          stream: true
        }),
      });

      if (!res.ok) throw new Error("API request failed");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader available");

      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Update the last message (the assistant's response) in real-time
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: fullResponse };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: "Sorry, I encountered an error while streaming. Please try again." };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card/50 border-white/5 overflow-hidden">
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full px-6 py-4" ref={scrollRef}>
          <div className="space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-4 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/5",
                  m.role === 'assistant' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === 'assistant' ? "bg-white/5 text-muted-foreground border border-white/5" : "bg-primary text-primary-foreground font-medium"
                )}>
                  {m.content || (isLoading && i === messages.length - 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : null)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="p-6 border-t border-white/5 bg-card/80 backdrop-blur-sm">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            placeholder={selectedFile ? `Ask about ${selectedFile.fileName}...` : "Ask a general question..."}
            className="bg-background/50 border-white/10 flex-1 focus-visible:ring-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </form>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Sparkles className="w-3 h-3 text-accent" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Live Stream Engine Active
          </p>
        </div>
      </div>
    </Card>
  );
}
