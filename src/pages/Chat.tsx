import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Phone, AlertTriangle, Bot, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history
  const { data: history } = useQuery({
    queryKey: ["chat-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (history && messages.length === 0) {
      setMessages(history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMessage = async (role: string, content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({ user_id: user.id, role, content });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    await saveMessage("user", userMsg.content);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages.slice(-20) }),
      });

      if (resp.status === 429) {
        toast({ title: "Please wait", description: "Too many requests. Try again in a moment.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Usage limit", description: "AI credits are used up. Please try later.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Failed to connect to AI");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      const updateAssistant = (content: string) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
          }
          return [...prev, { role: "assistant", content }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await saveMessage("assistant", assistantContent);
      }
    } catch (e: any) {
      toast({ title: "Connection error", description: "Could not reach the AI. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Wellness Guide</h1>
          <p className="text-xs text-muted-foreground">Here to listen, not to diagnose</p>
        </div>
        <button
          onClick={() => setShowCrisis(!showCrisis)}
          className="p-2 rounded-xl text-warning hover:bg-muted transition-colors"
          aria-label="Crisis resources"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Crisis Banner */}
      {showCrisis && (
        <div className="mx-5 mb-2 p-3 rounded-xl bg-secondary animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground mb-1">
            <AlertTriangle className="w-4 h-4" /> Crisis Resources
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988 (24/7)
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Crisis Text Line:</strong> Text HOME to 741741
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mx-5 mb-2 p-2 rounded-lg bg-muted/50 flex items-start gap-2">
        <AlertTriangle className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-tight">
          MindBridge is not a medical device and is not a substitute for professional mental health treatment.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Bot className="w-12 h-12 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Hi! I'm your wellness companion.</p>
            <p className="text-muted-foreground text-xs mt-1">Share what's on your mind, and I'll do my best to help.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-secondary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2 items-center animate-pulse-gentle">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="rounded-xl flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
