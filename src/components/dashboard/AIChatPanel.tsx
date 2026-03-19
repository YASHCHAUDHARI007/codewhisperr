"use client";

import { useState, useRef, useEffect } from 'react';
import { interactiveAiChat } from '@/ai/flows/interactive-ai-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatPanel({ codebaseContent }: { codebaseContent: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'ve analyzed your codebase. You can ask me anything about the logic, architecture, or specific functions.' }
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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await interactiveAiChat({
        query: userMessage,
        codebaseContent
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
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
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  m.role === 'assistant' ? "bg-white/5 text-muted-foreground border border-white/5" : "bg-primary text-primary-foreground font-medium"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-6 border-t border-white/5 bg-card/80 backdrop-blur-sm">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            placeholder="Ask about authentication logic, performance issues..." 
            className="bg-background/50 border-white/10 flex-1 focus-visible:ring-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-3 text-center uppercase tracking-widest font-bold">
          Powered by Gemini 1.5 Flash
        </p>
      </div>
    </Card>
  );
}