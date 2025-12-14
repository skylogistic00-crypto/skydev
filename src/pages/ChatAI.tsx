import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";

// ==============================
// TIPE PESAN
// ==============================
type Message = {
  id: number;
  from: "user" | "ai";
  text: string;
};

// ==============================
// KEYWORD PERTANYAAN KEUANGAN
// ==============================
const financialKeywords = [
  "kas",
  "pengeluaran",
  "pemasukan",
  "keuangan",
  "expense",
  "biaya",
  "beban",
  "laporan",
  "total",
  "cash out",
  "cash in",
  "arus kas",
  "profit",
  "rugi",
];

// ==========================================
// 1️⃣ FUNGSI UNTUK MENGIRIM KE CHAT-AI (opini/chat biasa)
// ==========================================
async function callChatAI(message: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supabase-functions-chat-ai`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
    },
    body: JSON.stringify({
      message,
      model: "gpt-4o-mini",
      conversation_id: null,
    }),
  });

  return await res.json(); // { reply }
}

// ==========================================
// 2️⃣ FUNGSI UNTUK MENGIRIM KE AI-ROUTER (SQL + penjelasan)
// ==========================================
async function callAIRouter(prompt: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/supabase-functions-ai-router`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
    },
    body: JSON.stringify({
      prompt,
      role: "super_admin", // bisa diganti berdasarkan auth app Anda
    }),
  });

  return await res.json(); // { sql, result, explanation }
}

// ==========================================
// UI CHAT
// ==========================================

export default function ChatAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Logika utama pengiriman pesan
  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      from: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const text = userMessage.text.toLowerCase();

      // cek apakah pertanyaan keuangan
      const isFinancialQuery = financialKeywords.some((k) => text.includes(k));

      let data: any;

      if (isFinancialQuery) {
        // 2️⃣ Route ke AI Router
        data = await callAIRouter(userMessage.text);

        // Check for errors
        if (data.error) {
          const errorMsg = 
            `❌ **Error:**\n${data.error}\n\n` +
            (data.sql ? `**Generated SQL:**\n\`\`\`sql\n${data.sql}\n\`\`\`\n\n` : '') +
            (data.details ? `**Details:** ${data.details}\n` : '') +
            (data.hint ? `**Hint:** ${data.hint}\n` : '') +
            (data.code ? `**Error Code:** ${data.code}` : '');
          
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, from: "ai", text: errorMsg },
          ]);
        } else {
          const aiCombined =
            `📊 **AI Router (Keuangan)**\n\n` +
            `**SQL:**\n\`\`\`sql\n${data.sql}\n\`\`\`\n\n` +
            `**Hasil:**\n\`\`\`json\n${JSON.stringify(data.result, null, 2)}\n\`\`\`\n\n` +
            `**Penjelasan:**\n${data.explanation}`;

          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, from: "ai", text: aiCombined },
          ]);
        }
      } else {
        // 1️⃣ Route ke Chat Biasa
        data = await callChatAI(userMessage.text);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: "ai",
            text: data.reply || "Tidak ada jawaban.",
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          from: "ai",
          text: "❌ Terjadi kesalahan: " + err.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex flex-col h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <h1 className="text-xl font-semibold">Chat AI (Hybrid Mode)</h1>
        <p className="text-sm text-gray-500">
          Chat biasa → chat-ai | Pertanyaan keuangan → ai-router (SQL)
        </p>
      </div>

      {/* CHAT */}
      <div className="flex-grow max-w-2xl mx-auto w-full flex flex-col bg-white shadow-md overflow-hidden">
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map(({ id, from, text }) => (
            <div
              key={id}
              className={`flex ${
                from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-3 whitespace-pre-wrap ${
                  from === "user"
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-green-500 text-white rounded-bl-sm"
                }`}
              >
                {text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-green-400 text-white rounded-xl shadow animate-pulse">
                AI sedang berpikir...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="border-t p-4 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Ketik pesan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send />
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
