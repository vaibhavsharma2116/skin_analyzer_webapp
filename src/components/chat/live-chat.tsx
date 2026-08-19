import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { chatWithAI } from "@/lib/chat.functions";
import { Button } from "@/components/ui/button";

type Message = {
  role: "user" | "model";
  text: string;
};

export function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hi there! I'm your SKNPOP AI assistant. How can I help you with your skin today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      // Format history for Gemini
      const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      const res = await chatWithAI({ data: { message, history } });
      return res.reply;
    },
    onSuccess: (reply) => {
      setMessages(prev => [...prev, { role: "model", text: reply }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "model", text: "Sorry, I'm having trouble connecting right now." }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    mutation.mutate(userMessage);
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl transition-transform hover:scale-105 z-50 ${isOpen ? "hidden" : "flex"}`}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[350px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">SKNPOP Expert</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/90 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex h-[400px] flex-col gap-4 overflow-y-auto p-4 bg-muted/20">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex gap-3 flex-row">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-foreground flex items-center gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border bg-background p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                className="flex-1 bg-muted/50 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ask about skincare..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-full" disabled={!input.trim() || mutation.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
