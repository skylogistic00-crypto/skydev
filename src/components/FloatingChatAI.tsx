import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Paperclip, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  fileName?: string;
}

export default function FloatingChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo! Saya AI Assistant. 💬\n\n💡 Ketik **'cek data'** untuk melihat data apa saja yang tersedia di database Anda.\n\n📎 Upload gambar atau dokumen untuk analisis!",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'id-ID'; // Indonesian language

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            alert('Microphone permission denied. Please allow microphone access.');
          }
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Failed to start recording:', error);
        alert('Failed to start recording. Please try again.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain"];
    if (!validTypes.includes(file.type)) {
      alert("File type not supported. Please upload an image, PDF, or text file.");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size too large. Maximum 10MB.");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;

    let imageUrl: string | undefined;
    let fileName: string | undefined;

    // Upload file if selected
    if (selectedFile) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
          reader.readAsDataURL(selectedFile);
        });

        imageUrl = await base64Promise;
        fileName = selectedFile.name;
      } catch (error) {
        console.error("File read error:", error);
        alert("Failed to read file");
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim() || `[Uploaded: ${fileName}]`,
      imageUrl,
      fileName,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    clearFile();
    setIsLoading(true);

    let responseContent = "";

    try {
      // If image/file is uploaded, use vision API
      if (userMessage.imageUrl) {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-openai-vision-ocr",
          {
            body: {
              imageBase64: userMessage.imageUrl,
              prompt: userMessage.content || "Analyze this image and describe what you see in detail."
            }
          }
        );

        if (error) throw error;

        if (data?.error) {
          responseContent = `❌ **Error:** ${data.error}`;
        } else {
          responseContent = data.text || "Tidak dapat menganalisis gambar";
        }
      } else {
        // Check if this is a database query (almost everything except greetings)
        const greetingKeywords = ["halo", "hai", "hello", "hi", "selamat", "terima kasih", "thanks"];
        const isGreeting = greetingKeywords.some(keyword => 
          userMessage.content.toLowerCase().includes(keyword)
        );
        
        // If not a greeting, treat as database query
        const isDatabaseQuery = !isGreeting;

        // Check if user wants to see available data
        if (userMessage.content.toLowerCase().includes("cek data") || 
            userMessage.content.toLowerCase().includes("data apa") ||
            userMessage.content.toLowerCase().includes("tabel apa")) {
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-check-data-availability",
          {}
        );

        if (error) throw error;

        if (data?.results) {
          // Show tables with data first, sorted by count
          const tablesWithData = Object.entries(data.results)
            .filter(([_, info]: any) => info.hasData)
            .map(([table, info]: any) => `✅ **${table}**: ${info.count} data`)
            .join("\n");

          const tablesEmpty = Object.entries(data.results)
            .filter(([_, info]: any) => !info.hasData)
            .map(([table]: any) => `❌ ${table}`)
            .join(", ");

          const totalTables = data.totalTables || Object.keys(data.results).length;
          const withData = data.tablesWithData || Object.values(data.results).filter((r: any) => r.hasData).length;

          responseContent = `📊 **Database Overview:**\n` +
            `Total: ${totalTables} tabel, ${withData} berisi data\n\n` +
            `**Tabel dengan data:**\n${tablesWithData || "Tidak ada"}\n\n` +
            (tablesEmpty ? `**Tabel kosong:** ${tablesEmpty}\n\n` : "") +
            `💡 **Contoh pertanyaan:**\n- "berapa stok di gudang?"\n- "list semua customer"\n- "total pengeluaran kas bulan ini"`;
        } else {
          responseContent = "Tidak dapat mengecek data.";
        }
      } else if (isDatabaseQuery) {
        // Use AI Intent Analyzer for SMART database queries with context
        // Build conversation history for context retention
        const conversationHistory = messages.slice(-6).map(m => ({
          role: m.role,
          content: m.content
        }));

        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-ai-intent-analyzer",
          {
            body: { 
              question: userMessage.content,
              conversationHistory
            },
          }
        );

        if (error) throw error;

        if (data?.needsClarification) {
          // AI needs clarification - ask user
          responseContent = `🤔 ${data.clarificationQuestion}`;
          
          // Show suggested queries if available
          if (data.suggestedQueries && data.suggestedQueries.length > 0) {
            responseContent += `\n\n💡 **Mungkin maksud Anda:**\n`;
            data.suggestedQueries.forEach((q: string) => {
              responseContent += `- "${q}"\n`;
            });
          }
        } else if (data?.error) {
          responseContent = `❌ **Error:** ${data.error}`;
          
          if (data.sql) {
            responseContent += `\n\n🔍 **Generated SQL:** \`${data.sql}\``;
          }
        } else {
          // Show the explanation (natural language answer)
          responseContent = data.explanation || "Tidak ada data";
          
          // Show intent understanding
          if (data.intent && userMessage.content.toLowerCase().includes("debug")) {
            responseContent += `\n\n🎯 **Intent:** ${data.intent}`;
          }
          
          // Show data count
          if (data.rowCount !== undefined) {
            responseContent += `\n\n📊 **Data:** ${data.rowCount} hasil`;
          }
          
          // Show suggested follow-up queries
          if (data.suggestedQueries && data.suggestedQueries.length > 0) {
            responseContent += `\n\n💡 **Pertanyaan terkait:**\n`;
            data.suggestedQueries.forEach((q: string) => {
              responseContent += `- "${q}"\n`;
            });
          }
          
          // Show SQL if user asks for debug
          if (userMessage.content.toLowerCase().includes("debug") && data.sql) {
            responseContent += `\n🔍 **SQL:** \`${data.sql}\``;
          }
        }
      } else {
        // Use regular chat AI for general questions
        const { data, error } = await supabase.functions.invoke(
          "supabase-functions-chat-ai",
          {
            body: { message: userMessage.content },
          }
        );

        if (error) throw error;
        responseContent = data?.reply || "Maaf, tidak ada respons dari AI.";
      }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat AI error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}. Silakan coba lagi.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Chat AI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-purple-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-8">
                  Mulai percakapan dengan AI Assistant
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      message.role === "user"
                        ? "bg-purple-600 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {message.imageUrl && (
                      <div className="mb-2">
                        <img 
                          src={message.imageUrl} 
                          alt={message.fileName || "Uploaded image"}
                          className="max-w-full rounded-lg"
                        />
                        {message.fileName && (
                          <p className="text-xs mt-1 opacity-75">{message.fileName}</p>
                        )}
                      </div>
                    )}
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-3 bg-gray-50">
            {/* File Preview */}
            {selectedFile && (
              <div className="mb-2 p-2 bg-white rounded border flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded" />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                      <Paperclip className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <span className="text-xs text-gray-600 truncate">{selectedFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
                className="flex-shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={toggleRecording}
                disabled={isLoading}
                className="flex-shrink-0"
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Listening..." : selectedFile ? "Tambahkan keterangan..." : "Ketik pesan..."}
                className="flex-1"
                disabled={isLoading || isRecording}
              />
              <Button
                onClick={sendMessage}
                disabled={(!input.trim() && !selectedFile) || isLoading}
                size="icon"
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
